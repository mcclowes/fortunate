'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { GameState, Card, ResolveResponse, AITurnResponse, CombatPhaseResponse, StateChange } from '@/lib/types'
import {
  createInitialGameState,
  playCard,
  endTurn,
  applyStateChanges,
  addLogEntry,
  executeBatchCombat
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
      // New effects mapped to existing particle types
      debuff: 'damage',
      discard: 'damage',
      mill: 'damage',
      gain_mana: 'spell',
      steal_mana: 'spell',
      apply_status: 'spell',
      remove_status: 'heal',
      add_shield: 'buff',
      steal_creature: 'spell',
      transform: 'summon',
      copy_creature: 'summon',
      bounce: 'spell',
    }

    const particleType = particleMap[change.type]
    if (particleType) {
      emit(particleType, x, y)
      playSoundForStateChange(change.type)
    }
  }, [emit, gameState])

  const parseSSEStream = useCallback(async <T extends ResolveResponse | CombatPhaseResponse>(
    response: Response,
    onText: (text: string) => void
  ): Promise<T> => {
    const reader = response.body?.getReader()
    if (!reader) throw new Error('No reader')

    const decoder = new TextDecoder()
    let result: T | null = null

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
            result = data as T
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

  // Execute combat phase - all creatures attack via a single AI prompt
  const executeCombatPhase = useCallback(async (
    state: GameState,
    who: 'player' | 'opponent'
  ): Promise<GameState> => {
    // Check if there are any creatures that can attack
    const attackers = state[who].field.filter(
      c => c.canAttack && !c.statusEffects?.includes('frozen')
    )

    if (attackers.length === 0) {
      return state // No combat needed
    }

    try {
      setStreamingText('')
      const response = await fetch('/api/combat-phase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameState: state, who })
      })

      if (!response.ok) throw new Error('Failed to execute combat')

      const result = await parseSSEStream<CombatPhaseResponse>(response, (text) => {
        setStreamingText(prev => prev + text)
      })

      setStreamingText('')

      if (result.attacks.length === 0) {
        return state
      }

      // Play attack sounds and emit particles
      playSound('attack')
      const targetRef = who === 'player' ? opponentHealthRef.current : playerHealthRef.current
      if (targetRef) {
        const rect = targetRef.getBoundingClientRect()
        emit('attack', rect.left + rect.width / 2, rect.top + rect.height / 2)
      }

      // Execute all attacks
      let newState = executeBatchCombat(state, who, result.attacks)

      // Add combat narrative to log
      if (result.narrative) {
        newState = addLogEntry(newState, who, result.narrative)
      }

      return newState
    } catch (error) {
      console.error('Combat phase error:', error)
      setStreamingText('')
      return addLogEntry(state, 'system', 'The creatures hesitate...')
    }
  }, [parseSSEStream, emit])

  // Complete the player's turn: combat phase -> end turn -> opponent turn
  const completePlayerTurn = useCallback(async (state: GameState) => {
    setIsLoading(true)

    // Combat phase
    setGameState({ ...state, phase: 'combat' })
    let newState = await executeCombatPhase(state, 'player')
    setGameState(newState)

    if (newState.phase === 'ended') {
      setIsLoading(false)
      return
    }

    await new Promise(r => setTimeout(r, 500))

    // End turn and start opponent's turn
    playSound('turnEnd')
    newState = endTurn(newState)
    newState = addLogEntry(newState, 'system', "Opponent's turn begins.")
    setGameState(newState)

    await new Promise(r => setTimeout(r, 500))
    await runOpponentTurn(newState)
  }, [executeCombatPhase])

  const handlePlayCard = useCallback(async (cardIndex: number) => {
    if (!canAct || !gameState || gameState.hasPlayedCard) return

    const result = playCard(gameState, 'player', cardIndex)
    if (!result) return

    // Play sound based on card type
    if (result.card.type === 'spell') {
      playSound('spellCast')
      if (playerFieldRef.current) {
        const rect = playerFieldRef.current.getBoundingClientRect()
        emit('spell', rect.left + rect.width / 2, rect.top + rect.height / 2)
      }
    } else {
      playSound('creatureSummon')
      if (playerFieldRef.current) {
        const rect = playerFieldRef.current.getBoundingClientRect()
        emit('summon', rect.left + rect.width / 2, rect.top + rect.height / 2)
      }
    }

    setIsLoading(true)
    setGameState({ ...result.state, phase: 'resolving' })

    // Resolve card effect
    let newState = await resolveCardEffect(result.state, result.card, 'player')
    setGameState(newState)

    if (newState.phase === 'ended') {
      setIsLoading(false)
      return
    }

    await new Promise(r => setTimeout(r, 800))

    // Complete the turn (combat + end turn + opponent)
    await completePlayerTurn(newState)
  }, [canAct, gameState, resolveCardEffect, emit, completePlayerTurn])

  // Skip playing a card and go straight to combat
  const handleSkipCard = useCallback(async () => {
    if (!canAct || !gameState || gameState.hasPlayedCard) return
    await completePlayerTurn(gameState)
  }, [canAct, gameState, completePlayerTurn])

  // Simplified opponent turn: play one card (optional) -> combat -> end turn
  const runOpponentTurn = useCallback(async (state: GameState) => {
    setIsLoading(true)

    try {
      let newState = state

      // AI decides whether to play a card
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

            if (newState.phase === 'ended') {
              setIsLoading(false)
              return
            }

            await new Promise(r => setTimeout(r, 1000))
          }
        }
      }

      // Combat phase
      setGameState({ ...newState, phase: 'combat' })
      newState = await executeCombatPhase(newState, 'opponent')
      setGameState(newState)

      if (newState.phase === 'ended') {
        setIsLoading(false)
        return
      }

      await new Promise(r => setTimeout(r, 500))

      // End turn
      playSound('turnStart')
      newState = endTurn(newState)
      newState = addLogEntry(newState, 'system', 'Your turn begins.')
      setGameState(newState)
      setIsLoading(false)
    } catch (error) {
      console.error('AI turn error:', error)
      const newState = endTurn(state)
      setGameState(addLogEntry(newState, 'system', 'The opponent ponders briefly, then ends their turn.'))
      setIsLoading(false)
    }
  }, [resolveCardEffect, executeCombatPhase, emit])

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
          <div className={styles.cardCount}>
            <span className={styles.icon}>🃏</span>
            {gameState.opponent.hand.length}
          </div>
        </div>

        <Hand
          cards={gameState.opponent.hand}
          isOpponent
        />

        <div className={styles.battlefield}>
          <div ref={opponentFieldRef}>
            <Field
              creatures={gameState.opponent.field}
              isOpponent
            />
          </div>

          <div className={styles.divider} />

          <div ref={playerFieldRef}>
            <Field
              creatures={gameState.player.field}
              isPlayerTurn={isPlayerTurn}
            />
          </div>
        </div>

        <Hand
          cards={gameState.player.hand}
          onPlayCard={!gameState.hasPlayedCard ? handlePlayCard : undefined}
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
          <div className={styles.cardCount}>
            <span className={styles.icon}>🃏</span>
            {gameState.player.hand.length}
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
            <span>{isPlayerTurn ? (gameState.hasPlayedCard ? 'Card played! Combat begins...' : 'Your turn - play a card or skip') : "Opponent's turn"}</span>
          )}
        </div>

        <div className={styles.controls}>
          <button
            className={styles.endTurnBtn}
            onClick={handleSkipCard}
            disabled={!canAct || gameState.hasPlayedCard}
          >
            Skip Card
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
