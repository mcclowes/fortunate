'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { GameState, Card, ResolveResponse, AITurnResponse, CreatureActionResponse, Creature, StateChange } from '@/lib/types'
import {
  createInitialGameState,
  playCard,
  endTurn,
  applyStateChanges,
  addLogEntry,
  creatureAttack
} from '@/lib/gameState'
import { playSound, playSoundForStateChange, ensureAudioReady } from '@/lib/sounds'
import { ParticleProvider, useParticles, ParticleType } from './ParticleEffect'
import Hand from './Hand'
import Field from './Field'
import GameLog from './GameLog'
import styles from '@/styles/Board.module.scss'

export default function Board() {
  return (
    <ParticleProvider>
      <BoardInner />
    </ParticleProvider>
  )
}

function BoardInner() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [streamingText, setStreamingText] = useState<string>('')
  const { emit } = useParticles()

  // Refs for particle effect positioning
  const playerFieldRef = useRef<HTMLDivElement>(null)
  const opponentFieldRef = useRef<HTMLDivElement>(null)
  const playerHealthRef = useRef<HTMLDivElement>(null)
  const opponentHealthRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setGameState(createInitialGameState())
    // Initialize audio on first user interaction
    const handleInteraction = () => {
      ensureAudioReady()
      document.removeEventListener('click', handleInteraction)
    }
    document.addEventListener('click', handleInteraction)
    return () => document.removeEventListener('click', handleInteraction)
  }, [])

  // Play victory/defeat sounds and particles when game ends
  useEffect(() => {
    if (gameState?.phase === 'ended') {
      if (gameState.winner === 'player') {
        playSound('victory')
        // Emit victory particles across the screen
        emit('victory', window.innerWidth / 2, window.innerHeight / 2)
        setTimeout(() => emit('victory', window.innerWidth / 3, window.innerHeight / 3), 200)
        setTimeout(() => emit('victory', window.innerWidth * 2 / 3, window.innerHeight / 3), 400)
      } else {
        playSound('defeat')
        emit('defeat', window.innerWidth / 2, window.innerHeight / 2)
      }
    }
  }, [gameState?.phase, gameState?.winner, emit])

  const isPlayerTurn = gameState?.currentPlayer === 'player'
  const canAct = isPlayerTurn && gameState?.phase === 'playing' && !isLoading

  // Helper to emit particles at a target location
  const emitEffectForChange = useCallback((change: StateChange) => {
    const getTargetRef = () => {
      if (change.target === 'player') return playerHealthRef.current
      if (change.target === 'opponent') return opponentHealthRef.current
      // For creatures, we'd need to find the creature element
      // For now, target the appropriate field
      if (change.targetId) {
        // Check if creature is on player or opponent field
        if (gameState?.player.field.some(c => c.instanceId === change.targetId)) {
          return playerFieldRef.current
        }
        if (gameState?.opponent.field.some(c => c.instanceId === change.targetId)) {
          return opponentFieldRef.current
        }
      }
      return null
    }

    const targetEl = getTargetRef()
    if (!targetEl) return

    const rect = targetEl.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2

    // Map state change types to particle types
    const particleMap: Record<string, ParticleType> = {
      damage: 'damage',
      heal: 'heal',
      destroy: 'destroy',
      buff: 'buff',
      summon: 'summon',
      draw: 'spell',
    }

    const particleType = particleMap[change.type]
    if (particleType) {
      emit(particleType, x, y)
      playSoundForStateChange(change.type)
    }
  }, [emit, gameState])

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

      // Play effects for each state change
      result.changes.forEach(change => {
        emitEffectForChange(change)
      })

      let newState = applyStateChanges(state, result.changes)
      newState = addLogEntry(newState, who, result.narrative)
      return newState
    } catch (error) {
      console.error('Resolution error:', error)
      setStreamingText('')
      return addLogEntry(state, 'system', `${card.name} fizzles mysteriously...`)
    }
  }, [parseSSEStream, emitEffectForChange])

  const handlePlayCard = useCallback(async (cardIndex: number) => {
    if (!canAct || !gameState) return

    const result = playCard(gameState, 'player', cardIndex)
    if (!result) return

    // Play sound based on card type
    if (result.card.type === 'spell') {
      playSound('spellCast')
      // Emit spell particles at player's field
      if (playerFieldRef.current) {
        const rect = playerFieldRef.current.getBoundingClientRect()
        emit('spell', rect.left + rect.width / 2, rect.top + rect.height / 2)
      }
    } else {
      playSound('creatureSummon')
      // Emit summon particles at player's field
      if (playerFieldRef.current) {
        const rect = playerFieldRef.current.getBoundingClientRect()
        emit('summon', rect.left + rect.width / 2, rect.top + rect.height / 2)
      }
    }

    setIsLoading(true)
    setGameState({ ...result.state, phase: 'resolving' })

    const newState = await resolveCardEffect(result.state, result.card, 'player')
    setGameState({ ...newState, phase: 'playing' })
    setIsLoading(false)
  }, [canAct, gameState, resolveCardEffect, emit])

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
        playSound('attack')
        // Emit attack particles at the target hero
        const targetRef = targetPlayer === 'player' ? playerHealthRef.current : opponentHealthRef.current
        if (targetRef) {
          const rect = targetRef.getBoundingClientRect()
          emit('attack', rect.left + rect.width / 2, rect.top + rect.height / 2)
        }
        newState = {
          ...newState,
          [targetPlayer]: {
            ...newState[targetPlayer],
            health: newState[targetPlayer].health - creature.currentAttack
          }
        }
      } else if (result.action === 'attack_creature' && result.targetId) {
        playSound('attack')
        // Emit attack particles at the target creature's field
        const targetField = newState.player.field.some(c => c.instanceId === result.targetId)
          ? playerFieldRef.current
          : opponentFieldRef.current
        if (targetField) {
          const rect = targetField.getBoundingClientRect()
          emit('attack', rect.left + rect.width / 2, rect.top + rect.height / 2)
        }
        newState = creatureAttack(newState, creature.instanceId, result.targetId)
        // Check if any creature was destroyed
        const targetCreature = state.player.field.find(c => c.instanceId === result.targetId)
          || state.opponent.field.find(c => c.instanceId === result.targetId)
        const attackingCreature = state.player.field.find(c => c.instanceId === creature.instanceId)
          || state.opponent.field.find(c => c.instanceId === creature.instanceId)
        if (targetCreature && attackingCreature) {
          // Check if target died
          if (targetCreature.currentHealth <= attackingCreature.currentAttack) {
            setTimeout(() => playSound('destroy'), 200)
            if (targetField) {
              const rect = targetField.getBoundingClientRect()
              setTimeout(() => emit('destroy', rect.left + rect.width / 2, rect.top + rect.height / 2), 200)
            }
          }
        }
      } else if (result.action === 'special' && result.changes) {
        result.changes.forEach(change => emitEffectForChange(change))
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
  }, [parseSSEStream, emit, emitEffectForChange])

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
              // Play sound based on card type
              if (result.card.type === 'spell') {
                playSound('spellCast')
                if (opponentFieldRef.current) {
                  const rect = opponentFieldRef.current.getBoundingClientRect()
                  emit('spell', rect.left + rect.width / 2, rect.top + rect.height / 2)
                }
              } else {
                playSound('creatureSummon')
                if (opponentFieldRef.current) {
                  const rect = opponentFieldRef.current.getBoundingClientRect()
                  emit('summon', rect.left + rect.width / 2, rect.top + rect.height / 2)
                }
              }
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
        playSound('turnStart')
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
  }, [resolveCardEffect, executeCreatureAction, emit])

  const handleEndTurn = useCallback(async () => {
    if (!canAct || !gameState) return

    playSound('turnEnd')
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
          <div ref={opponentHealthRef} className={styles.health}>
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
          <div ref={opponentFieldRef}>
            <Field
              creatures={gameState.opponent.field}
              isOpponent
              onCreatureClick={handleCreatureClick}
            />
          </div>

          <div className={styles.divider} />

          <div ref={playerFieldRef}>
            <Field
              creatures={gameState.player.field}
              isPlayerTurn={isPlayerTurn}
              onCreatureClick={handleCreatureClick}
            />
          </div>
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
          <div ref={playerHealthRef} className={styles.health}>
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
