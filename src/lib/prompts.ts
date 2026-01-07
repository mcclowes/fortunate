import { GameState, Card, Creature, ActiveEffect } from './types'

export const RESOLVE_SYSTEM_PROMPT = `Narrate card effects in a whimsical card game. Be creative but brief (1-2 sentences).

Respond with JSON only:
{"narrative": "What happens", "changes": [...]}

Change types:
- Immediate: {"type": "damage|heal|destroy|buff|draw", "target": "player|opponent|creature", "targetId": "id-if-creature", "value": number}
- Delayed effect: {"type": "apply_effect", "target": "player|opponent", "effect": {
    "name": "Effect Name",
    "description": "What it does",
    "source": "Card name",
    "owner": "player|opponent",
    "target": {"type": "player|creature|all_creatures|global", "who": "player|opponent|both", "creatureId": "id-if-creature"},
    "trigger": "start_of_turn|end_of_turn|passive",
    "turnsRemaining": 2,
    "effectType": "damage|heal|buff|debuff|draw|prevent_attack|modify_cost",
    "value": number
  }}

Effect scale: 1-cost = 1-2 damage/+1 buff. 5-cost = 4-5 damage or multiple effects.
Delayed effects: Use for curses, blessings, omens. Duration 2-3 turns typical. Cards hinting at "bad luck", "omen", "curse", "blessing", "over time" should use apply_effect.
Creatures already summoned - describe entry effects only.`

function formatActiveEffects(effects: ActiveEffect[]): string {
  if (effects.length === 0) return 'none'
  return effects.map(e => `${e.name}(${e.turnsRemaining ?? '∞'} turns, ${e.effectType})`).join(', ')
}

export function createResolvePrompt(gameState: GameState, card: Card, who: 'player' | 'opponent'): string {
  const enemy = gameState[who === 'player' ? 'opponent' : 'player']
  const enemyCreatures = enemy.field.map(c => `${c.name}[${c.instanceId}](${c.currentAttack}/${c.currentHealth})`).join(',') || 'none'
  const activeEffects = formatActiveEffects(gameState.activeEffects)

  return `${card.name} (${card.type}, ${card.cost} mana): "${card.flavor}"
Caster: ${who}
Enemy: ${enemy.health}hp, creatures: ${enemyCreatures}
Active effects: ${activeEffects}
${card.type === 'creature' ? 'Creature summoned - describe entry effect.' : 'Cast spell effect.'}`
}

export const AI_TURN_SYSTEM_PROMPT = `AI opponent in card game. Pick ONE action. JSON only:
{"action": "play|end_turn", "cardIndex": 0, "narrative": "brief quip"}
Priority: play affordable cards > end turn. Consider active effects when making decisions.`

export function createAITurnPrompt(gameState: GameState): string {
  const opponent = gameState.opponent
  const hand = opponent.hand.map((c, i) => `${i}:${c.name}(${c.cost})`).join(' ')
  const activeEffects = formatActiveEffects(gameState.activeEffects)

  return `Mana:${opponent.mana} Hand:[${hand}] Active effects: ${activeEffects}
Pick card index to play or end_turn.`
}

export const CREATURE_ACTION_SYSTEM_PROMPT = `Creature acts based on personality. JSON only:
{"action": "attack_creature|attack_hero|special", "targetId": "id", "narrative": "1 sentence", "changes": []}

70% attack, 30% personality-based. Special changes: {type,target,targetId,value}
Consider active effects that may prevent attacks or modify behavior.`

export function createCreatureActionPrompt(
  creature: Creature,
  owner: 'player' | 'opponent',
  gameState: GameState
): string {
  const enemyState = gameState[owner === 'player' ? 'opponent' : 'player']
  const enemies = enemyState.field.map(c => `${c.name}[${c.instanceId}]`).join(',') || 'none'
  const activeEffects = formatActiveEffects(gameState.activeEffects)
  const creatureEffects = creature.appliedEffects?.length ? `Applied: ${creature.appliedEffects.join(', ')}` : ''

  return `${creature.name}(${creature.currentAttack}/${creature.currentHealth}): "${creature.flavor}"
Enemy: ${enemyState.health}hp, creatures: ${enemies}
Active effects: ${activeEffects}${creatureEffects ? '\n' + creatureEffects : ''}`
}
