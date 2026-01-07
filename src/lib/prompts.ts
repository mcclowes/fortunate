import { GameState, Card, Creature } from './types'

export const RESOLVE_SYSTEM_PROMPT = `Narrate card effects in a whimsical card game. Be creative but brief (1-2 sentences).

Respond with JSON only:
{"narrative": "What happens", "changes": [{"type": "damage|heal|destroy|buff|draw", "target": "player|opponent|creature", "targetId": "id-if-creature", "value": number}]}

Effect scale: 1-cost = 1-2 damage/+1 buff. 5-cost = 4-5 damage or multiple effects. Creatures already summoned - describe entry effects only.`

export function createResolvePrompt(gameState: GameState, card: Card, who: 'player' | 'opponent'): string {
  const enemy = gameState[who === 'player' ? 'opponent' : 'player']
  const enemyCreatures = enemy.field.map(c => `${c.name}[${c.instanceId}](${c.currentAttack}/${c.currentHealth})`).join(',') || 'none'

  return `${card.name} (${card.type}, ${card.cost} mana): "${card.flavor}"
Enemy: ${enemy.health}hp, creatures: ${enemyCreatures}
${card.type === 'creature' ? 'Creature summoned - describe entry effect.' : 'Cast spell effect.'}`
}

export const AI_TURN_SYSTEM_PROMPT = `AI opponent in card game. Pick ONE action. JSON only:
{"action": "play|end_turn", "cardIndex": 0, "narrative": "brief quip"}
Priority: play affordable cards > end turn.`

export function createAITurnPrompt(gameState: GameState): string {
  const opponent = gameState.opponent
  const hand = opponent.hand.map((c, i) => `${i}:${c.name}(${c.cost})`).join(' ')

  return `Mana:${opponent.mana} Hand:[${hand}] Pick card index to play or end_turn.`
}

export const CREATURE_ACTION_SYSTEM_PROMPT = `Creature acts based on personality. JSON only:
{"action": "attack_creature|attack_hero|special", "targetId": "id", "narrative": "1 sentence", "changes": []}

70% attack, 30% personality-based. Special changes: {type,target,targetId,value}`

export function createCreatureActionPrompt(
  creature: Creature,
  owner: 'player' | 'opponent',
  gameState: GameState
): string {
  const enemyState = gameState[owner === 'player' ? 'opponent' : 'player']
  const enemies = enemyState.field.map(c => `${c.name}[${c.instanceId}]`).join(',') || 'none'

  return `${creature.name}(${creature.currentAttack}/${creature.currentHealth}): "${creature.flavor}"
Enemy: ${enemyState.health}hp, creatures: ${enemies}`
}
