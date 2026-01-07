import { GameState, PlayerState, Card, Creature, StateChange, GameEvent, StatusEffect } from './types'
import { createStarterDeck } from './cards'

function createPlayerState(): PlayerState {
  const deck = createStarterDeck()
  const hand = deck.splice(0, 4) // Draw 4 starting cards
  return {
    health: 30,
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
    hasPlayedCard: false
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

  // Can only play one card per turn
  if (!card || state.hasPlayedCard) return null

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
      hasPlayedCard: true,
      [who]: {
        ...playerState,
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
          // Support separate attack/health values, or use value for both
          const attackBuff = change.attack ?? change.value ?? 0
          const healthBuff = change.health ?? change.value ?? 0
          newState = modifyCreatureStats(newState, change.targetId, attackBuff, healthBuff)
        }
        break

      case 'debuff':
        if (change.targetId) {
          // Reduce stats (use negative values internally)
          const attackDebuff = -(change.attack ?? change.value ?? 0)
          const healthDebuff = -(change.health ?? change.value ?? 0)
          newState = modifyCreatureStats(newState, change.targetId, attackDebuff, healthDebuff)
        }
        break

      case 'draw':
        const drawer = change.target === 'player' ? 'player' : 'opponent'
        for (let i = 0; i < (change.value || 1); i++) {
          newState = drawCard(newState, drawer)
        }
        break

      case 'discard':
        const discarder = change.target === 'player' ? 'player' : 'opponent'
        newState = discardCards(newState, discarder, change.value || 1)
        break

      case 'mill':
        const miller = change.target === 'player' ? 'player' : 'opponent'
        newState = millCards(newState, miller, change.value || 1)
        break

      case 'apply_status':
        if (change.targetId && change.status) {
          newState = applyStatusEffect(newState, change.targetId, change.status)
        }
        break

      case 'remove_status':
        if (change.targetId && change.status) {
          newState = removeStatusEffect(newState, change.targetId, change.status)
        }
        break

      case 'add_shield':
        if (change.targetId) {
          newState = addShield(newState, change.targetId, change.value || 1)
        }
        break

      case 'summon':
        if (change.card && change.card.type === 'creature' && change.card.baseStats) {
          const who = change.target === 'player' ? 'player' : 'opponent'
          newState = summonCreature(newState, who, change.card)
        }
        break

      case 'steal_creature':
        if (change.targetId) {
          newState = stealCreature(newState, change.targetId)
        }
        break

      case 'transform':
        if (change.targetId && change.card && change.card.type === 'creature') {
          newState = transformCreature(newState, change.targetId, change.card)
        }
        break

      case 'copy_creature':
        if (change.targetId) {
          const who = change.target === 'player' ? 'player' : 'opponent'
          newState = copyCreature(newState, change.targetId, who)
        }
        break

      case 'bounce':
        if (change.targetId) {
          newState = bounceCreature(newState, change.targetId)
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
        // Shield absorbs damage first
        const shield = c.shield || 0
        if (shield >= damage) {
          return { ...c, shield: shield - damage }
        } else {
          const remainingDamage = damage - shield
          return { ...c, shield: 0, currentHealth: c.currentHealth - remainingDamage }
        }
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

function modifyCreatureStats(state: GameState, instanceId: string, attackChange: number, healthChange: number): GameState {
  const updateField = (field: Creature[]): Creature[] => {
    return field.map(c => {
      if (c.instanceId === instanceId) {
        const newHealth = c.currentHealth + healthChange
        // If health drops to 0 or below, creature dies
        return {
          ...c,
          currentAttack: Math.max(0, c.currentAttack + attackChange),
          currentHealth: newHealth
        }
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

function discardCards(state: GameState, who: 'player' | 'opponent', count: number): GameState {
  const playerState = state[who]
  // Discard random cards from hand
  const newHand = [...playerState.hand]
  for (let i = 0; i < count && newHand.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * newHand.length)
    newHand.splice(randomIndex, 1)
  }
  return {
    ...state,
    [who]: { ...playerState, hand: newHand }
  }
}

function millCards(state: GameState, who: 'player' | 'opponent', count: number): GameState {
  const playerState = state[who]
  // Remove cards from top of deck
  const cardsToRemove = Math.min(count, playerState.deck.length)
  return {
    ...state,
    [who]: { ...playerState, deck: playerState.deck.slice(cardsToRemove) }
  }
}

function applyStatusEffect(state: GameState, instanceId: string, status: StatusEffect): GameState {
  const updateField = (field: Creature[]): Creature[] => {
    return field.map(c => {
      if (c.instanceId === instanceId) {
        const currentEffects = c.statusEffects || []
        if (!currentEffects.includes(status)) {
          return { ...c, statusEffects: [...currentEffects, status] }
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

function removeStatusEffect(state: GameState, instanceId: string, status: StatusEffect): GameState {
  const updateField = (field: Creature[]): Creature[] => {
    return field.map(c => {
      if (c.instanceId === instanceId) {
        const currentEffects = c.statusEffects || []
        return { ...c, statusEffects: currentEffects.filter(s => s !== status) }
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

function addShield(state: GameState, instanceId: string, amount: number): GameState {
  const updateField = (field: Creature[]): Creature[] => {
    return field.map(c => {
      if (c.instanceId === instanceId) {
        return { ...c, shield: (c.shield || 0) + amount }
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

function summonCreature(state: GameState, who: 'player' | 'opponent', card: Card): GameState {
  if (!card.baseStats) return state

  const creature: Creature = {
    ...card,
    instanceId: `${card.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    currentHealth: card.baseStats.health,
    currentAttack: card.baseStats.attack,
    canAttack: false, // Summoning sickness
    isToken: true
  }

  return {
    ...state,
    [who]: {
      ...state[who],
      field: [...state[who].field, creature]
    }
  }
}

function stealCreature(state: GameState, instanceId: string): GameState {
  // Find which field the creature is on
  const playerCreatureIndex = state.player.field.findIndex(c => c.instanceId === instanceId)
  const opponentCreatureIndex = state.opponent.field.findIndex(c => c.instanceId === instanceId)

  if (playerCreatureIndex !== -1) {
    // Creature belongs to player, move to opponent
    const creature = { ...state.player.field[playerCreatureIndex], originalOwner: 'player' as const, canAttack: false }
    return {
      ...state,
      player: {
        ...state.player,
        field: state.player.field.filter((_, i) => i !== playerCreatureIndex)
      },
      opponent: {
        ...state.opponent,
        field: [...state.opponent.field, creature]
      }
    }
  } else if (opponentCreatureIndex !== -1) {
    // Creature belongs to opponent, move to player
    const creature = { ...state.opponent.field[opponentCreatureIndex], originalOwner: 'opponent' as const, canAttack: false }
    return {
      ...state,
      player: {
        ...state.player,
        field: [...state.player.field, creature]
      },
      opponent: {
        ...state.opponent,
        field: state.opponent.field.filter((_, i) => i !== opponentCreatureIndex)
      }
    }
  }

  return state
}

function transformCreature(state: GameState, instanceId: string, intoCard: Card): GameState {
  if (!intoCard.baseStats) return state

  const updateField = (field: Creature[]): Creature[] => {
    return field.map(c => {
      if (c.instanceId === instanceId) {
        return {
          ...intoCard,
          instanceId: `${intoCard.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          currentHealth: intoCard.baseStats!.health,
          currentAttack: intoCard.baseStats!.attack,
          canAttack: false // Cannot attack after transform
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

function copyCreature(state: GameState, instanceId: string, copyTo: 'player' | 'opponent'): GameState {
  // Find the creature to copy
  const allCreatures = [...state.player.field, ...state.opponent.field]
  const original = allCreatures.find(c => c.instanceId === instanceId)

  if (!original) return state

  const copy: Creature = {
    ...original,
    instanceId: `${original.id}-copy-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    canAttack: false, // Summoning sickness
    isToken: true
  }

  return {
    ...state,
    [copyTo]: {
      ...state[copyTo],
      field: [...state[copyTo].field, copy]
    }
  }
}

function bounceCreature(state: GameState, instanceId: string): GameState {
  // Find which field the creature is on
  const playerCreatureIndex = state.player.field.findIndex(c => c.instanceId === instanceId)
  const opponentCreatureIndex = state.opponent.field.findIndex(c => c.instanceId === instanceId)

  if (playerCreatureIndex !== -1) {
    const creature = state.player.field[playerCreatureIndex]
    // Don't return tokens to hand - they just disappear
    if (creature.isToken) {
      return {
        ...state,
        player: {
          ...state.player,
          field: state.player.field.filter((_, i) => i !== playerCreatureIndex)
        }
      }
    }
    // Return card to hand (without instance properties)
    const card: Card = {
      id: creature.id,
      name: creature.name,
      flavor: creature.flavor,
      type: creature.type,
      image: creature.image,
      baseStats: creature.baseStats
    }
    return {
      ...state,
      player: {
        ...state.player,
        field: state.player.field.filter((_, i) => i !== playerCreatureIndex),
        hand: [...state.player.hand, card]
      }
    }
  } else if (opponentCreatureIndex !== -1) {
    const creature = state.opponent.field[opponentCreatureIndex]
    // Don't return tokens to hand
    if (creature.isToken) {
      return {
        ...state,
        opponent: {
          ...state.opponent,
          field: state.opponent.field.filter((_, i) => i !== opponentCreatureIndex)
        }
      }
    }
    const card: Card = {
      id: creature.id,
      name: creature.name,
      flavor: creature.flavor,
      type: creature.type,
      image: creature.image,
      baseStats: creature.baseStats
    }
    return {
      ...state,
      opponent: {
        ...state.opponent,
        field: state.opponent.field.filter((_, i) => i !== opponentCreatureIndex),
        hand: [...state.opponent.hand, card]
      }
    }
  }

  return state
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

  // Process end-of-turn status effects for the current player's creatures
  const processEndTurnEffects = (field: Creature[]): Creature[] => {
    return field
      .map(c => {
        const effects = c.statusEffects || []
        let updated = { ...c }

        // Doomed creatures die at end of turn
        if (effects.includes('doomed')) {
          return { ...updated, currentHealth: 0 }
        }

        return updated
      })
      .filter(c => c.currentHealth > 0)
  }

  // Process start-of-turn status effects for the new active player's creatures
  const processStartTurnEffects = (field: Creature[]): Creature[] => {
    return field
      .map(c => {
        const effects = c.statusEffects || []
        let updated = { ...c }

        // Poisoned creatures take 1 damage at start of turn
        if (effects.includes('poisoned')) {
          // Shield absorbs poison damage too
          const shield = updated.shield || 0
          if (shield > 0) {
            updated = { ...updated, shield: shield - 1 }
          } else {
            updated = { ...updated, currentHealth: updated.currentHealth - 1 }
          }
        }

        return updated
      })
      .filter(c => c.currentHealth > 0)
  }

  // Refresh creatures to attack (except frozen)
  const refreshPlayer = (ps: PlayerState, isActive: boolean): PlayerState => {
    if (!isActive) {
      // End of turn: process doomed
      return {
        ...ps,
        field: processEndTurnEffects(ps.field)
      }
    }

    // Start of turn: process poison, refresh creatures
    const processedField = processStartTurnEffects(ps.field)

    return {
      ...ps,
      field: processedField.map(c => {
        const effects = c.statusEffects || []
        // Frozen creatures can't attack and lose frozen status
        if (effects.includes('frozen')) {
          return {
            ...c,
            canAttack: false,
            statusEffects: effects.filter(e => e !== 'frozen')
          }
        }
        // Stealth creatures that haven't attacked stay stealthed
        return { ...c, canAttack: true }
      })
    }
  }

  let newState: GameState = {
    ...state,
    turn: newTurn,
    currentPlayer: nextPlayer,
    player: refreshPlayer(state.player, nextPlayer === 'player'),
    opponent: refreshPlayer(state.opponent, nextPlayer === 'opponent'),
    phase: 'playing',
    hasPlayedCard: false
  }

  // Draw a card for the new active player
  newState = drawCard(newState, nextPlayer)

  return checkWinCondition(newState)
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

  // Check if attacker is frozen
  if (attacker.statusEffects?.includes('frozen')) return state

  const enemyField = isPlayerCreature ? state.opponent.field : state.player.field

  // Check taunt - if enemy has taunt creatures, must target them
  const tauntCreatures = enemyField.filter(c => c.statusEffects?.includes('taunt'))
  if (tauntCreatures.length > 0 && (targetId === 'player' || targetId === 'opponent')) {
    // Trying to attack hero but taunt exists - invalid
    return state
  }
  if (tauntCreatures.length > 0 && typeof targetId === 'string' && targetId !== 'player' && targetId !== 'opponent') {
    const targetCreature = enemyField.find(c => c.instanceId === targetId)
    if (targetCreature && !targetCreature.statusEffects?.includes('taunt')) {
      // Trying to attack non-taunt creature when taunt exists - invalid
      return state
    }
  }

  // Check stealth - can't target stealthed creatures
  if (typeof targetId === 'string' && targetId !== 'player' && targetId !== 'opponent') {
    const targetCreature = enemyField.find(c => c.instanceId === targetId)
    if (targetCreature?.statusEffects?.includes('stealth')) {
      return state // Can't attack stealthed creature
    }
  }

  let newState = state

  // Mark attacker as having attacked and remove stealth if present
  const updateAttacker = (field: Creature[]) =>
    field.map(c => {
      if (c.instanceId === attackerId) {
        const effects = c.statusEffects || []
        return {
          ...c,
          canAttack: false,
          statusEffects: effects.filter(e => e !== 'stealth')
        }
      }
      return c
    })

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

// Helper function to check if a creature has a specific status
export function hasStatus(creature: Creature, status: StatusEffect): boolean {
  return creature.statusEffects?.includes(status) || false
}

// Helper to get taunt creatures for targeting validation
export function getTauntCreatures(state: GameState, who: 'player' | 'opponent'): Creature[] {
  return state[who].field.filter(c => c.statusEffects?.includes('taunt'))
}

// Execute batch combat - all creatures of a player attack in sequence
export function executeBatchCombat(
  state: GameState,
  who: 'player' | 'opponent',
  attacks: Array<{ attackerId: string; targetId: string | 'hero' }>
): GameState {
  let newState = { ...state }
  const enemy = who === 'player' ? 'opponent' : 'player'

  for (const attack of attacks) {
    // Find the attacking creature (it must still be alive and able to attack)
    const attacker = newState[who].field.find(c => c.instanceId === attack.attackerId)
    if (!attacker || !attacker.canAttack) continue
    if (attacker.statusEffects?.includes('frozen')) continue

    if (attack.targetId === 'hero') {
      // Attack the enemy hero
      newState = creatureAttack(newState, attack.attackerId, enemy)
    } else {
      // Attack a creature
      newState = creatureAttack(newState, attack.attackerId, attack.targetId)
    }

    // Check win condition after each attack
    if (newState.phase === 'ended') break
  }

  return newState
}
