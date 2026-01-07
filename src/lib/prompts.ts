import { GameState, Card, Creature, GameEvent } from './types'

// Format recent battle history for narrative continuity
function formatBattleHistory(log: GameEvent[], maxEvents: number = 6): string {
  if (log.length <= 1) return '' // Skip if only the opening message

  const recentEvents = log.slice(-maxEvents)
  const history = recentEvents
    .map(e => `[Turn ${e.turn}] ${e.actor}: ${e.narrative}`)
    .join('\n')

  return `\n---BATTLE STORY SO FAR---\n${history}\n---END STORY---\n`
}

export const RESOLVE_SYSTEM_PROMPT = `Narrate card effects in a whimsical card game. Be creative but brief (1-2 sentences).

IMPORTANT: Build on the ongoing battle story! Reference previous events, escalate tension, develop rivalries between creatures, and make each moment feel like part of an epic tale. If a creature was previously wounded or a spell was cast, acknowledge that history.

Respond with JSON only:
{"narrative": "What happens", "changes": [{"type": "damage|heal|destroy|buff|draw", "target": "player|opponent|creature", "targetId": "id-if-creature", "value": number}]}

Effect scale: 1-cost = 1-2 damage/+1 buff. 5-cost = 4-5 damage or multiple effects. Creatures already summoned - describe entry effects only.`

export function createResolvePrompt(gameState: GameState, card: Card, who: 'player' | 'opponent'): string {
  const enemy = gameState[who === 'player' ? 'opponent' : 'player']
  const ally = gameState[who]
  const enemyCreatures = enemy.field.map(c => `${c.name}[${c.instanceId}](${c.currentAttack}/${c.currentHealth})`).join(',') || 'none'
  const allyCreatures = ally.field.map(c => `${c.name}[${c.instanceId}](${c.currentAttack}/${c.currentHealth})`).join(',') || 'none'
  const battleHistory = formatBattleHistory(gameState.log)

  return `${battleHistory}Turn ${gameState.turn} - ${who === 'player' ? 'Hero' : 'Opponent'} plays:
${card.name} (${card.type}, ${card.cost} mana): "${card.flavor}"
Battlefield - Our side: ${allyCreatures} | Enemy: ${enemy.health}hp, creatures: ${enemyCreatures}
${card.type === 'creature' ? 'Creature summoned - describe entry effect.' : 'Cast spell effect.'}`
}

export const AI_TURN_SYSTEM_PROMPT = `AI opponent in card game. Pick ONE action. JSON only:
{"action": "play|end_turn", "cardIndex": 0, "narrative": "brief quip"}
Priority: play affordable cards > end turn.

Your narrative should acknowledge the battle's momentum - are you pressing an advantage, making a desperate play, or biding your time?`

export function createAITurnPrompt(gameState: GameState): string {
  const opponent = gameState.opponent
  const player = gameState.player
  const hand = opponent.hand.map((c, i) => `${i}:${c.name}(${c.cost})`).join(' ')
  const battleHistory = formatBattleHistory(gameState.log, 4) // Fewer events for decisions

  return `${battleHistory}Turn ${gameState.turn} - Your move.
Your health: ${opponent.health}hp | Enemy health: ${player.health}hp
Mana:${opponent.mana} Hand:[${hand}] Pick card index to play or end_turn.`
}

export const CREATURE_ACTION_SYSTEM_PROMPT = `Creature acts based on personality. JSON only:
{"action": "attack_creature|attack_hero|special", "targetId": "id", "narrative": "1 sentence", "changes": []}

70% attack, 30% personality-based. Special changes: {type,target,targetId,value}

IMPORTANT: The creature remembers the battle! If it has history with an enemy creature (fought before, watched an ally fall), reference that. Build rivalries, vendettas, and heroic moments.`

export function createCreatureActionPrompt(
  creature: Creature,
  owner: 'player' | 'opponent',
  gameState: GameState
): string {
  const enemyState = gameState[owner === 'player' ? 'opponent' : 'player']
  const enemies = enemyState.field.map(c => `${c.name}[${c.instanceId}](${c.currentAttack}/${c.currentHealth})`).join(',') || 'none'
  const battleHistory = formatBattleHistory(gameState.log)

  return `${battleHistory}Turn ${gameState.turn} - ${creature.name} acts!
${creature.name}(${creature.currentAttack}/${creature.currentHealth}): "${creature.flavor}"
Enemy: ${enemyState.health}hp, creatures: ${enemies}`
}
