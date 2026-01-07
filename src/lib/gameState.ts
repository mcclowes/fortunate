import { GameState, PlayerState, Card, Creature, StateChange, GameEvent } from './types'
import { createStarterDeck } from './cards'

function createPlayerState(): PlayerState {
  const deck = createStarterDeck()
  const hand = deck.splice(0, 4) // Draw 4 starting cards
  return {
    health: 30,
    mana: 1,
    maxMana: 1,
    hand,
    deck,
    field: []
  }
}

export function createInitialGameState(): GameState {
  return {
    turn: 1,
    currentPlayer: 'player',
    player: createPlayerState(),
    opponent: createPlayerState(),
    log: [{
      turn: 1,
      actor: 'system',
      narrative: 'The battle begins! Two champions face off in a contest of wit and whimsy.',
      timestamp: Date.now()
    }],
    phase: 'playing'
  }
}

export function drawCard(state: GameState, who: 'player' | 'opponent'): GameState {
  const playerState = state[who]
  if (playerState.deck.length === 0) return state

  const [drawn, ...remaining] = playerState.deck
  return {
    ...state,
    [who]: {
      ...playerState,
      deck: remaining,
      hand: [...playerState.hand, drawn]
    }
  }
}

export function playCard(state: GameState, who: 'player' | 'opponent', cardIndex: number): { state: GameState; card: Card } | null {
  const playerState = state[who]
  const card = playerState.hand[cardIndex]

  if (!card || card.cost > playerState.mana) return null

  const newHand = [...playerState.hand]
  newHand.splice(cardIndex, 1)

  let newField = playerState.field
  if (card.type === 'creature' && card.baseStats) {
    const creature: Creature = {
      ...card,
      instanceId: `${card.id}-${Date.now()}`,
      currentHealth: card.baseStats.health,
      currentAttack: card.baseStats.attack,
      canAttack: false // Can't attack the turn it's played
    }
    newField = [...playerState.field, creature]
  }

  return {
    state: {
      ...state,
      [who]: {
        ...playerState,
        mana: playerState.mana - card.cost,
        hand: newHand,
        field: newField
      }
    },
    card
  }
}

export function applyStateChanges(state: GameState, changes: StateChange[]): GameState {
  let newState = { ...state }

  for (const change of changes) {
    switch (change.type) {
      case 'damage':
        if (change.target === 'player') {
          newState = {
            ...newState,
            player: {
              ...newState.player,
              health: Math.max(0, newState.player.health - (change.value || 0))
            }
          }
        } else if (change.target === 'opponent') {
          newState = {
            ...newState,
            opponent: {
              ...newState.opponent,
              health: Math.max(0, newState.opponent.health - (change.value || 0))
            }
          }
        } else if (change.target === 'creature' && change.targetId) {
          newState = damageCreature(newState, change.targetId, change.value || 0)
        }
        break

      case 'heal':
        if (change.target === 'player') {
          newState = {
            ...newState,
            player: {
              ...newState.player,
              health: Math.min(30, newState.player.health + (change.value || 0))
            }
          }
        } else if (change.target === 'opponent') {
          newState = {
            ...newState,
            opponent: {
              ...newState.opponent,
              health: Math.min(30, newState.opponent.health + (change.value || 0))
            }
          }
        }
        break

      case 'destroy':
        if (change.targetId) {
          newState = destroyCreature(newState, change.targetId)
        }
        break

      case 'buff':
        if (change.targetId) {
          newState = buffCreature(newState, change.targetId, change.value || 0)
        }
        break

      case 'draw':
        const drawer = change.target === 'player' ? 'player' : 'opponent'
        for (let i = 0; i < (change.value || 1); i++) {
          newState = drawCard(newState, drawer)
        }
        break
    }
  }

  return checkWinCondition(newState)
}

function damageCreature(state: GameState, instanceId: string, damage: number): GameState {
  const updateField = (field: Creature[]): Creature[] => {
    return field.map(c => {
      if (c.instanceId === instanceId) {
        return { ...c, currentHealth: c.currentHealth - damage }
      }
      return c
    }).filter(c => c.currentHealth > 0)
  }

  return {
    ...state,
    player: { ...state.player, field: updateField(state.player.field) },
    opponent: { ...state.opponent, field: updateField(state.opponent.field) }
  }
}

function destroyCreature(state: GameState, instanceId: string): GameState {
  return {
    ...state,
    player: {
      ...state.player,
      field: state.player.field.filter(c => c.instanceId !== instanceId)
    },
    opponent: {
      ...state.opponent,
      field: state.opponent.field.filter(c => c.instanceId !== instanceId)
    }
  }
}

function buffCreature(state: GameState, instanceId: string, value: number): GameState {
  const updateField = (field: Creature[]): Creature[] => {
    return field.map(c => {
      if (c.instanceId === instanceId) {
        return {
          ...c,
          currentAttack: c.currentAttack + value,
          currentHealth: c.currentHealth + value
        }
      }
      return c
    })
  }

  return {
    ...state,
    player: { ...state.player, field: updateField(state.player.field) },
    opponent: { ...state.opponent, field: updateField(state.opponent.field) }
  }
}

function checkWinCondition(state: GameState): GameState {
  if (state.player.health <= 0) {
    return { ...state, phase: 'ended', winner: 'opponent' }
  }
  if (state.opponent.health <= 0) {
    return { ...state, phase: 'ended', winner: 'player' }
  }
  return state
}

export function endTurn(state: GameState): GameState {
  const nextPlayer = state.currentPlayer === 'player' ? 'opponent' : 'player'
  const newTurn = nextPlayer === 'player' ? state.turn + 1 : state.turn
  const newMaxMana = Math.min(10, nextPlayer === 'player' ? state.player.maxMana + 1 : state.opponent.maxMana + 1)

  // Refresh mana and allow creatures to attack
  const refreshPlayer = (ps: PlayerState, isActive: boolean): PlayerState => {
    if (!isActive) return ps
    return {
      ...ps,
      mana: Math.min(10, ps.maxMana + 1),
      maxMana: Math.min(10, ps.maxMana + 1),
      field: ps.field.map(c => ({ ...c, canAttack: true }))
    }
  }

  let newState: GameState = {
    ...state,
    turn: newTurn,
    currentPlayer: nextPlayer,
    player: refreshPlayer(state.player, nextPlayer === 'player'),
    opponent: refreshPlayer(state.opponent, nextPlayer === 'opponent'),
    phase: 'playing'
  }

  // Draw a card for the new active player
  newState = drawCard(newState, nextPlayer)

  return newState
}

export function addLogEntry(state: GameState, actor: 'player' | 'opponent' | 'system', narrative: string): GameState {
  const event: GameEvent = {
    turn: state.turn,
    actor,
    narrative,
    timestamp: Date.now()
  }
  return {
    ...state,
    log: [...state.log, event]
  }
}

export function creatureAttack(
  state: GameState,
  attackerId: string,
  targetId: string | 'player' | 'opponent'
): GameState {
  // Find the attacker
  const isPlayerCreature = state.player.field.some(c => c.instanceId === attackerId)
  const attackerField = isPlayerCreature ? state.player.field : state.opponent.field
  const attacker = attackerField.find(c => c.instanceId === attackerId)

  if (!attacker || !attacker.canAttack) return state

  let newState = state

  // Mark attacker as having attacked
  const updateAttacker = (field: Creature[]) =>
    field.map(c => c.instanceId === attackerId ? { ...c, canAttack: false } : c)

  if (isPlayerCreature) {
    newState = { ...newState, player: { ...newState.player, field: updateAttacker(newState.player.field) } }
  } else {
    newState = { ...newState, opponent: { ...newState.opponent, field: updateAttacker(newState.opponent.field) } }
  }

  // Apply damage
  if (targetId === 'player') {
    newState = {
      ...newState,
      player: { ...newState.player, health: newState.player.health - attacker.currentAttack }
    }
  } else if (targetId === 'opponent') {
    newState = {
      ...newState,
      opponent: { ...newState.opponent, health: newState.opponent.health - attacker.currentAttack }
    }
  } else {
    // Creature vs creature combat
    const defenderField = isPlayerCreature ? newState.opponent.field : newState.player.field
    const defender = defenderField.find(c => c.instanceId === targetId)
    if (defender) {
      newState = damageCreature(newState, targetId, attacker.currentAttack)
      newState = damageCreature(newState, attackerId, defender.currentAttack)
    }
  }

  return checkWinCondition(newState)
}
