'use client'

import { useState, useCallback, useEffect } from 'react'
import { GameState, Card, ResolveResponse, AITurnResponse, CreatureActionResponse, Creature } from '@/lib/types'
import {
  createInitialGameState,
  playCard,
  endTurn,
  applyStateChanges,
  addLogEntry,
  creatureAttack
} from '@/lib/gameState'
import Hand from './Hand'
import Field from './Field'
import GameLog from './GameLog'
import styles from '@/styles/Board.module.scss'

export default function Board() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [streamingText, setStreamingText] = useState<string>('')

  useEffect(() => {
    setGameState(createInitialGameState())
  }, [])

  const isPlayerTurn = gameState?.currentPlayer === 'player'
  const canAct = isPlayerTurn && gameState?.phase === 'playing' && !isLoading

  const parseSSEStream = useCallback(async (
    response: Response,
    onText: (text: string) => void
  ): Promise<ResolveResponse | CreatureActionResponse> => {
    const reader = response.body?.getReader()
    if (!reader) throw new Error('No reader')

    const decoder = new TextDecoder()
    let result: ResolveResponse | CreatureActionResponse | null = null

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6))
          if (data.type === 'text') {
            onText(data.text)
          } else if (data.type === 'result') {
            result = data
          }
        }
      }
    }

    if (!result) throw new Error('No result received')
    return result
  }, [])

  const resolveCardEffect = useCallback(async (state: GameState, card: Card, who: 'player' | 'opponent') => {
    try {
      setStreamingText('')
      const response = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameState: state, card, who })
      })

      if (!response.ok) throw new Error('Failed to resolve')

      const result = await parseSSEStream(response, (text) => {
        setStreamingText(prev => prev + text)
      }) as ResolveResponse

      setStreamingText('')
      let newState = applyStateChanges(state, result.changes)
      newState = addLogEntry(newState, who, result.narrative)
      return newState
    } catch (error) {
      console.error('Resolution error:', error)
      setStreamingText('')
      return addLogEntry(state, 'system', `${card.name} fizzles mysteriously...`)
    }
  }, [parseSSEStream])

  const handlePlayCard = useCallback(async (cardIndex: number) => {
    if (!canAct || !gameState) return

    const result = playCard(gameState, 'player', cardIndex)
    if (!result) return

    setIsLoading(true)
    setGameState({ ...result.state, phase: 'resolving' })

    const newState = await resolveCardEffect(result.state, result.card, 'player')
    setGameState({ ...newState, phase: 'playing' })
    setIsLoading(false)
  }, [canAct, gameState, resolveCardEffect])

  const executeCreatureAction = useCallback(async (
    state: GameState,
    creature: Creature,
    owner: 'player' | 'opponent'
  ): Promise<GameState> => {
    try {
      setStreamingText('')
      const response = await fetch('/api/creature-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameState: state, creature, owner })
      })
      if (!response.ok) throw new Error('Failed to get creature action')

      const result = await parseSSEStream(response, (text) => {
        setStreamingText(prev => prev + text)
      }) as CreatureActionResponse

      setStreamingText('')
      let newState = state

      // Mark creature as having acted
      const updateField = (field: Creature[]) =>
        field.map(c => c.instanceId === creature.instanceId ? { ...c, canAttack: false } : c)

      if (owner === 'player') {
        newState = { ...newState, player: { ...newState.player, field: updateField(newState.player.field) } }
      } else {
        newState = { ...newState, opponent: { ...newState.opponent, field: updateField(newState.opponent.field) } }
      }

      if (result.action === 'attack_hero') {
        const targetPlayer = owner === 'player' ? 'opponent' : 'player'
        newState = {
          ...newState,
          [targetPlayer]: {
            ...newState[targetPlayer],
            health: newState[targetPlayer].health - creature.currentAttack
          }
        }
      } else if (result.action === 'attack_creature' && result.targetId) {
        newState = creatureAttack(newState, creature.instanceId, result.targetId)
      } else if (result.action === 'special' && result.changes) {
        newState = applyStateChanges(newState, result.changes)
      }

      newState = addLogEntry(newState, owner, result.narrative)

      // Check win condition
      if (newState.player.health <= 0) {
        newState = { ...newState, phase: 'ended', winner: 'opponent' }
      } else if (newState.opponent.health <= 0) {
        newState = { ...newState, phase: 'ended', winner: 'player' }
      }

      return newState
    } catch (error) {
      console.error('Creature action error:', error)
      setStreamingText('')
      return addLogEntry(state, 'system', `${creature.name} hesitates, unsure what to do...`)
    }
  }, [parseSSEStream])

  const handleCreatureClick = useCallback(async (instanceId: string) => {
    if (!canAct || !gameState) return

    const playerCreature = gameState.player.field.find(c => c.instanceId === instanceId)

    // Only allow clicking on player's creatures that can attack
    if (playerCreature && playerCreature.canAttack) {
      setIsLoading(true)
      const newState = await executeCreatureAction(gameState, playerCreature, 'player')
      setGameState(newState)
      setIsLoading(false)
    }
  }, [canAct, gameState, executeCreatureAction])

  const runOpponentTurn = useCallback(async (state: GameState) => {
    setIsLoading(true)

    try {
      // Check if AI has any playable cards
      const hasPlayableCards = state.opponent.hand.some(c => c.cost <= state.opponent.mana)
      const creaturesCanAct = state.opponent.field.filter(c => c.canAttack)

      let newState = state

      // First, play cards if possible
      if (hasPlayableCards) {
        const response = await fetch('/api/ai-turn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameState: newState })
        })

        if (response.ok) {
          const aiResponse: AITurnResponse = await response.json()

          if (aiResponse.action === 'play' && aiResponse.cardIndex !== undefined) {
            const card = newState.opponent.hand[aiResponse.cardIndex]
            const result = playCard(newState, 'opponent', aiResponse.cardIndex)
            if (result) {
              newState = result.state
              newState = addLogEntry(newState, 'opponent', `The opponent plays ${card.name}!`)
              newState = await resolveCardEffect(newState, result.card, 'opponent')
              setGameState(newState)
              await new Promise(r => setTimeout(r, 1500))

              // Recursively continue turn
              if (newState.phase !== 'ended') {
                await runOpponentTurn(newState)
                return
              }
            }
          }
        }
      }

      // Then, let each creature act
      for (const creature of creaturesCanAct) {
        if (newState.phase === 'ended') break
        // Check creature is still alive
        if (!newState.opponent.field.some(c => c.instanceId === creature.instanceId)) continue

        const currentCreature = newState.opponent.field.find(c => c.instanceId === creature.instanceId)
        if (!currentCreature || !currentCreature.canAttack) continue

        newState = await executeCreatureAction(newState, currentCreature, 'opponent')
        setGameState(newState)
        await new Promise(r => setTimeout(r, 1500))
      }

      // End turn
      if (newState.phase !== 'ended') {
        newState = endTurn(newState)
        newState = addLogEntry(newState, 'system', 'Your turn begins.')
        setGameState(newState)
      }
      setIsLoading(false)
    } catch (error) {
      console.error('AI turn error:', error)
      const newState = endTurn(state)
      setGameState(addLogEntry(newState, 'system', 'The opponent ponders briefly, then ends their turn.'))
      setIsLoading(false)
    }
  }, [resolveCardEffect, executeCreatureAction])

  const handleEndTurn = useCallback(async () => {
    if (!canAct || !gameState) return

    let newState = endTurn(gameState)
    newState = addLogEntry(newState, 'system', "Opponent's turn begins.")
    setGameState(newState)

    await new Promise(r => setTimeout(r, 500))
    await runOpponentTurn(newState)
  }, [canAct, gameState, runOpponentTurn])

  const handleRestart = useCallback(() => {
    setGameState(createInitialGameState())
    setIsLoading(false)
  }, [])

  if (!gameState) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Preparing the battlefield...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.board}>
        {/* Opponent area */}
        <div className={`${styles.heroArea} ${styles.opponent}`}>
          <div className={styles.heroInfo}>
            <span className={styles.heroName}>Opponent</span>
          </div>
          <div className={styles.health}>
            <span className={styles.icon}>❤️</span>
            {gameState.opponent.health}
          </div>
          <div className={styles.mana}>
            <span className={styles.icon}>💎</span>
            {gameState.opponent.mana}/{gameState.opponent.maxMana}
          </div>
        </div>

        <Hand
          cards={gameState.opponent.hand}
          mana={gameState.opponent.mana}
          isOpponent
        />

        <div className={styles.battlefield}>
          <Field
            creatures={gameState.opponent.field}
            isOpponent
            onCreatureClick={handleCreatureClick}
          />

          <div className={styles.divider} />

          <Field
            creatures={gameState.player.field}
            isPlayerTurn={isPlayerTurn}
            onCreatureClick={handleCreatureClick}
          />
        </div>

        <Hand
          cards={gameState.player.hand}
          mana={gameState.player.mana}
          onPlayCard={handlePlayCard}
        />

        {/* Player area */}
        <div className={`${styles.heroArea} ${styles.player}`}>
          <div className={styles.heroInfo}>
            <span className={styles.heroName}>You</span>
          </div>
          <div className={styles.health}>
            <span className={styles.icon}>❤️</span>
            {gameState.player.health}
          </div>
          <div className={styles.mana}>
            <span className={styles.icon}>💎</span>
            {gameState.player.mana}/{gameState.player.maxMana}
          </div>
        </div>

        <div className={styles.status}>
          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              {streamingText ? (
                <span className={styles.streamingText}>{streamingText}</span>
              ) : (
                <span>The fates deliberate...</span>
              )}
            </div>
          ) : (
            <span>{isPlayerTurn ? 'Your turn - click a creature to activate it!' : "Opponent's turn"}</span>
          )}
        </div>

        <div className={styles.controls}>
          <button
            className={styles.endTurnBtn}
            onClick={handleEndTurn}
            disabled={!canAct}
          >
            End Turn
          </button>
          <button className={styles.restartBtn} onClick={handleRestart}>
            New Game
          </button>
        </div>
      </div>

      <div className={styles.sidebar}>
        <GameLog events={gameState.log} />
      </div>

      {gameState.phase === 'ended' && (
        <div className={styles.gameOver}>
          <div className={`${styles.gameOverContent} ${gameState.winner === 'player' ? styles.win : styles.lose}`}>
            <h2>{gameState.winner === 'player' ? 'Victory!' : 'Defeat!'}</h2>
            <p>{gameState.winner === 'player'
              ? 'Your legend will be sung for generations.'
              : 'A valiant effort, but fate had other plans.'
            }</p>
            <button className={styles.endTurnBtn} onClick={handleRestart}>
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
