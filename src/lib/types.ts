export type CardType = 'creature' | 'spell'

export type Card = {
  id: string
  name: string
  flavor: string
  cost: number
  type: CardType
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
}

export type StateChange = {
  type: 'damage' | 'heal' | 'summon' | 'destroy' | 'buff' | 'draw' | 'discard'
  target: 'player' | 'opponent' | 'creature'
  targetId?: string
  value?: number
  card?: Card
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
