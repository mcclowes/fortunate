import { GameState, PlayerState, Card, Creature, StateChange, GameEvent, ActiveEffect, EffectTrigger, EffectTriggerResult } from './types'
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
    phase: 'playing',
    activeEffects: []
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

      case 'apply_effect':
        if (change.effect) {
          newState = addEffect(newState, change.effect)
        }
        break

      case 'remove_effect':
        if (change.effectId) {
          newState = removeEffect(newState, change.effectId)
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

// Effect Management Functions

function generateEffectId(): string {
  return `effect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function addEffect(state: GameState, effectData: Omit<ActiveEffect, 'id' | 'createdOnTurn'>): GameState {
  const newEffect: ActiveEffect = {
    ...effectData,
    id: generateEffectId(),
    createdOnTurn: state.turn
  }

  // If targeting a specific creature, add the effect ID to the creature's appliedEffects
  let newState = {
    ...state,
    activeEffects: [...state.activeEffects, newEffect]
  }

  if (newEffect.target.type === 'creature') {
    const { who, creatureId } = newEffect.target
    const updateField = (field: Creature[]): Creature[] => {
      return field.map(c => {
        if (c.instanceId === creatureId) {
          return {
            ...c,
            appliedEffects: [...(c.appliedEffects || []), newEffect.id]
          }
        }
        return c
      })
    }

    newState = {
      ...newState,
      [who]: {
        ...newState[who],
        field: updateField(newState[who].field)
      }
    }
  }

  return newState
}

function removeEffect(state: GameState, effectId: string): GameState {
  const effect = state.activeEffects.find(e => e.id === effectId)
  if (!effect) return state

  // Remove effect ID from any creatures that have it
  const cleanCreatureEffects = (field: Creature[]): Creature[] => {
    return field.map(c => ({
      ...c,
      appliedEffects: (c.appliedEffects || []).filter(id => id !== effectId)
    }))
  }

  return {
    ...state,
    activeEffects: state.activeEffects.filter(e => e.id !== effectId),
    player: {
      ...state.player,
      field: cleanCreatureEffects(state.player.field)
    },
    opponent: {
      ...state.opponent,
      field: cleanCreatureEffects(state.opponent.field)
    }
  }
}

export function getActiveEffects(state: GameState): ActiveEffect[] {
  return state.activeEffects
}

export function getEffectsForTrigger(state: GameState, trigger: EffectTrigger, who?: 'player' | 'opponent'): ActiveEffect[] {
  return state.activeEffects.filter(e => {
    if (e.trigger !== trigger) return false
    if (who && e.owner !== who) return false
    return true
  })
}

// Process all effects for a given trigger point
export function processEffectTrigger(
  state: GameState,
  trigger: EffectTrigger,
  who: 'player' | 'opponent'
): { state: GameState; results: EffectTriggerResult[] } {
  const effects = getEffectsForTrigger(state, trigger, who)
  const results: EffectTriggerResult[] = []
  let newState = state

  for (const effect of effects) {
    const result = applyEffect(newState, effect)
    newState = result.state
    results.push({
      effect,
      narrative: result.narrative,
      changes: result.changes,
      expired: result.expired
    })

    // Decrement turns remaining and remove if expired
    if (effect.turnsRemaining !== undefined) {
      const remaining = effect.turnsRemaining - 1
      if (remaining <= 0) {
        newState = removeEffect(newState, effect.id)
      } else {
        newState = {
          ...newState,
          activeEffects: newState.activeEffects.map(e =>
            e.id === effect.id ? { ...e, turnsRemaining: remaining } : e
          )
        }
      }
    }
  }

  return { state: newState, results }
}

// Apply a single effect and return the changes made
function applyEffect(state: GameState, effect: ActiveEffect): {
  state: GameState
  narrative: string
  changes: StateChange[]
  expired: boolean
} {
  const changes: StateChange[] = []
  let newState = state
  const expired = effect.turnsRemaining !== undefined && effect.turnsRemaining <= 1

  switch (effect.effectType) {
    case 'damage': {
      const target = effect.target
      if (target.type === 'player') {
        changes.push({ type: 'damage', target: target.who, value: effect.value || 1 })
      } else if (target.type === 'creature' && target.creatureId) {
        changes.push({ type: 'damage', target: 'creature', targetId: target.creatureId, value: effect.value || 1 })
      } else if (target.type === 'all_creatures') {
        const fields = target.who === 'both'
          ? [...state.player.field, ...state.opponent.field]
          : state[target.who].field
        for (const creature of fields) {
          changes.push({ type: 'damage', target: 'creature', targetId: creature.instanceId, value: effect.value || 1 })
        }
      }
      break
    }

    case 'heal': {
      const target = effect.target
      if (target.type === 'player') {
        changes.push({ type: 'heal', target: target.who, value: effect.value || 1 })
      }
      break
    }

    case 'buff': {
      const target = effect.target
      if (target.type === 'creature' && target.creatureId) {
        changes.push({ type: 'buff', target: 'creature', targetId: target.creatureId, value: effect.value || 1 })
      } else if (target.type === 'all_creatures') {
        const fields = target.who === 'both'
          ? [...state.player.field, ...state.opponent.field]
          : state[target.who].field
        for (const creature of fields) {
          changes.push({ type: 'buff', target: 'creature', targetId: creature.instanceId, value: effect.value || 1 })
        }
      }
      break
    }

    case 'debuff': {
      const target = effect.target
      if (target.type === 'creature' && target.creatureId) {
        // Debuff is just a negative buff
        changes.push({ type: 'buff', target: 'creature', targetId: target.creatureId, value: -(effect.value || 1) })
      } else if (target.type === 'all_creatures') {
        const fields = target.who === 'both'
          ? [...state.player.field, ...state.opponent.field]
          : state[target.who].field
        for (const creature of fields) {
          changes.push({ type: 'buff', target: 'creature', targetId: creature.instanceId, value: -(effect.value || 1) })
        }
      }
      break
    }

    case 'draw': {
      const target = effect.target
      if (target.type === 'player') {
        changes.push({ type: 'draw', target: target.who, value: effect.value || 1 })
      }
      break
    }

    case 'prevent_attack': {
      // This is handled passively during attack resolution
      // No immediate changes needed
      break
    }

    case 'modify_cost': {
      // This is handled passively during card playing
      // No immediate changes needed
      break
    }

    case 'custom': {
      // Custom effects can include their own changes in customData
      if (effect.customData?.changes && Array.isArray(effect.customData.changes)) {
        changes.push(...(effect.customData.changes as StateChange[]))
      }
      break
    }
  }

  // Apply the changes
  if (changes.length > 0) {
    newState = applyStateChanges(newState, changes)
  }

  return {
    state: newState,
    narrative: `${effect.name}: ${effect.description}`,
    changes,
    expired
  }
}

// Check if a creature can attack considering active effects
export function canCreatureAttack(state: GameState, creature: Creature): boolean {
  if (!creature.canAttack) return false

  // Check for prevent_attack effects targeting this creature
  const preventEffects = state.activeEffects.filter(e =>
    e.effectType === 'prevent_attack' &&
    e.trigger === 'passive' &&
    e.target.type === 'creature' &&
    e.target.creatureId === creature.instanceId
  )

  return preventEffects.length === 0
}

// Get the effective mana cost of a card considering active effects
export function getEffectiveCost(state: GameState, card: Card, who: 'player' | 'opponent'): number {
  let cost = card.cost

  // Check for modify_cost effects
  const costEffects = state.activeEffects.filter(e =>
    e.effectType === 'modify_cost' &&
    e.trigger === 'passive' &&
    ((e.target.type === 'player' && e.target.who === who) || e.target.type === 'global')
  )

  for (const effect of costEffects) {
    cost += effect.value || 0
  }

  return Math.max(0, cost) // Cost can't go below 0
}

// Clean up effects that target removed creatures
export function cleanupDeadCreatureEffects(state: GameState): GameState {
  const allCreatureIds = [
    ...state.player.field.map(c => c.instanceId),
    ...state.opponent.field.map(c => c.instanceId)
  ]

  const validEffects = state.activeEffects.filter(e => {
    if (e.target.type === 'creature') {
      return allCreatureIds.includes(e.target.creatureId)
    }
    return true
  })

  if (validEffects.length === state.activeEffects.length) {
    return state
  }

  return {
    ...state,
    activeEffects: validEffects
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
