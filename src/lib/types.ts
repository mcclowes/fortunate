export type CardType = 'creature' | 'spell'

export type Card = {
  id: string
  name: string
  flavor: string
  cost: number
  type: CardType
  image?: string
  baseStats?: {
    attack: number
    health: number
  }
}

export type Creature = Card & {
  instanceId: string
  currentHealth: number
  currentAttack: number
  canAttack: boolean
  appliedEffects?: string[] // IDs of effects currently affecting this creature
}

// Effect system for delayed/persistent card effects
export type EffectTrigger =
  | 'start_of_turn'    // Triggers at the start of owner's turn
  | 'end_of_turn'      // Triggers at the end of owner's turn
  | 'on_damage'        // Triggers when target takes damage
  | 'on_play'          // Triggers when a card is played
  | 'passive'          // Always active while effect exists

export type EffectTarget =
  | { type: 'player'; who: 'player' | 'opponent' }
  | { type: 'creature'; who: 'player' | 'opponent'; creatureId: string }
  | { type: 'all_creatures'; who: 'player' | 'opponent' | 'both' }
  | { type: 'global' }  // Affects the whole game

export type ActiveEffect = {
  id: string                    // Unique identifier
  name: string                  // Display name (e.g., "Bad Luck Curse")
  description: string           // What the effect does
  source: string                // Card name that created this effect
  owner: 'player' | 'opponent'  // Who owns/cast the effect
  target: EffectTarget          // What the effect targets
  trigger: EffectTrigger        // When the effect activates
  turnsRemaining?: number       // How many turns until it expires (undefined = permanent)
  createdOnTurn: number         // Turn the effect was created

  // What happens when triggered
  effectType: 'damage' | 'heal' | 'buff' | 'debuff' | 'draw' | 'prevent_attack' | 'modify_cost' | 'custom'
  value?: number                // Magnitude of the effect
  customData?: Record<string, unknown>  // For special effects
}

export type PlayerState = {
  health: number
  mana: number
  maxMana: number
  hand: Card[]
  deck: Card[]
  field: Creature[]
}

export type GameEvent = {
  turn: number
  actor: 'player' | 'opponent' | 'system'
  narrative: string
  timestamp: number
}

export type GameState = {
  turn: number
  currentPlayer: 'player' | 'opponent'
  player: PlayerState
  opponent: PlayerState
  log: GameEvent[]
  phase: 'playing' | 'resolving' | 'combat' | 'ended'
  winner?: 'player' | 'opponent'
  activeEffects: ActiveEffect[]  // All currently active delayed/persistent effects
}

export type StateChange = {
  type: 'damage' | 'heal' | 'summon' | 'destroy' | 'buff' | 'draw' | 'discard' | 'apply_effect' | 'remove_effect'
  target: 'player' | 'opponent' | 'creature'
  targetId?: string
  value?: number
  card?: Card
  // For apply_effect type
  effect?: Omit<ActiveEffect, 'id' | 'createdOnTurn'>
  // For remove_effect type
  effectId?: string
}

export type EffectTriggerResult = {
  effect: ActiveEffect
  narrative: string
  changes: StateChange[]
  expired: boolean
}

export type ResolveResponse = {
  narrative: string
  changes: StateChange[]
}

export type AITurnResponse = {
  action: 'play' | 'attack' | 'end_turn'
  cardIndex?: number
  attackerId?: string
  targetId?: string
  narrative: string
}

export type CreatureActionResponse = {
  action: 'attack_creature' | 'attack_hero' | 'special'
  targetId?: string
  narrative: string
  changes?: StateChange[]
}
