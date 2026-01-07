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

// Format creature with stats, shield, and status effects
function formatCreature(c: Creature): string {
  const stats = `${c.currentAttack}/${c.currentHealth}`
  const shield = c.shield ? `+${c.shield}🛡` : ''
  const statuses = c.statusEffects?.length ? `[${c.statusEffects.join(',')}]` : ''
  return `${c.name}[${c.instanceId}](${stats}${shield})${statuses}`
}

export const RESOLVE_SYSTEM_PROMPT = `Narrate card effects in a whimsical card game. Be creative but brief (1-2 sentences).

IMPORTANT: Build on the ongoing battle story! Reference previous events, escalate tension, develop rivalries between creatures, and make each moment feel like part of an epic tale. If a creature was previously wounded or a spell was cast, acknowledge that history.

Respond with JSON only:
{"narrative": "What happens", "changes": [StateChange, ...]}

StateChange types:
- {"type": "damage", "target": "player|opponent|creature", "targetId": "id-if-creature", "value": number}
- {"type": "heal", "target": "player|opponent", "value": number}
- {"type": "destroy", "target": "creature", "targetId": "creature-id"}
- {"type": "buff", "target": "creature", "targetId": "id", "attack": number, "health": number} (or "value" for both)
- {"type": "debuff", "target": "creature", "targetId": "id", "attack": number, "health": number}
- {"type": "draw", "target": "player|opponent", "value": count}
- {"type": "discard", "target": "player|opponent", "value": count}
- {"type": "mill", "target": "player|opponent", "value": count} (removes from deck)
- {"type": "apply_status", "target": "creature", "targetId": "id", "status": "frozen|poisoned|taunt|stealth|silenced|doomed"}
- {"type": "remove_status", "target": "creature", "targetId": "id", "status": "status-name"}
- {"type": "add_shield", "target": "creature", "targetId": "id", "value": amount}
- {"type": "summon", "target": "player|opponent", "card": {id,name,flavor,type:"creature",baseStats:{attack,health}}}
- {"type": "steal_creature", "target": "creature", "targetId": "creature-id"}
- {"type": "transform", "target": "creature", "targetId": "id", "card": {creature-card}}
- {"type": "copy_creature", "target": "player|opponent", "targetId": "creature-to-copy"}
- {"type": "bounce", "target": "creature", "targetId": "creature-id"} (returns to hand)

Status effects: frozen (skip attack), poisoned (1 dmg/turn), taunt (must be attacked), stealth (untargetable), silenced (no abilities), doomed (dies end of turn)

Effect scale: Small effects = 1-2 damage/+1 buff. Medium effects = 2-3 damage or status. Big effects = 4-5 damage or multiple effects. Creatures already summoned - describe entry effects only.`

export function createResolvePrompt(gameState: GameState, card: Card, who: 'player' | 'opponent'): string {
  const caster = gameState[who]
  const enemy = gameState[who === 'player' ? 'opponent' : 'player']
  const enemyCreatures = enemy.field.map(formatCreature).join(', ') || 'none'
  const friendlyCreatures = caster.field.map(formatCreature).join(', ') || 'none'
  const battleHistory = formatBattleHistory(gameState.log)

  return `${battleHistory}Turn ${gameState.turn} - ${who === 'player' ? 'Hero' : 'Opponent'} plays:
${card.name} (${card.type}): "${card.flavor}"
Caster: ${caster.health}hp, creatures: ${friendlyCreatures}
Enemy: ${enemy.health}hp, creatures: ${enemyCreatures}
${card.type === 'creature' ? 'Creature summoned - describe entry effect.' : 'Cast spell effect.'}`
}

export const AI_TURN_SYSTEM_PROMPT = `AI opponent in card game. Pick ONE action. JSON only:
{"action": "play|pass", "cardIndex": 0, "narrative": "brief quip"}
You can play exactly one card per turn, or pass to skip.

Your narrative should acknowledge the battle's momentum - are you pressing an advantage, making a desperate play, or biding your time?`

export function createAITurnPrompt(gameState: GameState): string {
  const opponent = gameState.opponent
  const player = gameState.player
  const hand = opponent.hand.map((c, i) => `${i}:${c.name}`).join(' ')
  const battleHistory = formatBattleHistory(gameState.log, 4)

  return `${battleHistory}Turn ${gameState.turn} - Your move.
Your health: ${opponent.health}hp | Enemy health: ${player.health}hp
Hand:[${hand}] Pick ONE card index to play, or "pass" to skip playing a card.`
}

export const CREATURE_ACTION_SYSTEM_PROMPT = `Creature acts based on personality. JSON only:
{"action": "attack_creature|attack_hero|special", "targetId": "id", "narrative": "1 sentence", "changes": []}

70% attack, 30% personality-based special ability.

For special actions, use StateChange format:
- damage/heal/destroy/buff/debuff creatures
- apply_status with "status": "frozen|poisoned|taunt|stealth|silenced|doomed"
- add_shield, steal_creature, bounce, copy_creature

Note: Creatures with taunt MUST be attacked first. Stealthed creatures can't be targeted.

IMPORTANT: The creature remembers the battle! If it has history with an enemy creature (fought before, watched an ally fall), reference that. Build rivalries, vendettas, and heroic moments.`

export function createCreatureActionPrompt(
  creature: Creature,
  owner: 'player' | 'opponent',
  gameState: GameState
): string {
  const enemyState = gameState[owner === 'player' ? 'opponent' : 'player']
  const enemies = enemyState.field.map(formatCreature).join(', ') || 'none'
  const tauntWarning = enemyState.field.some(c => c.statusEffects?.includes('taunt'))
    ? ' (TAUNT creature must be attacked first!)'
    : ''
  const creatureStatus = creature.statusEffects?.length ? ` [${creature.statusEffects.join(', ')}]` : ''
  const battleHistory = formatBattleHistory(gameState.log)

  return `${battleHistory}Turn ${gameState.turn} - ${creature.name} acts!
${creature.name}(${creature.currentAttack}/${creature.currentHealth})${creatureStatus}: "${creature.flavor}"
Enemy: ${enemyState.health}hp, creatures: ${enemies}${tauntWarning}`
}

// Combat phase prompt - resolves all creature attacks in one narrative
export const COMBAT_PHASE_SYSTEM_PROMPT = `You are the narrator for a combat phase in a whimsical card game. All creatures attack automatically.

Respond with JSON only:
{"narrative": "Dramatic 2-4 sentence narrative describing ALL attacks", "attacks": [{"attackerId": "id", "targetId": "id-or-hero"}, ...]}

Rules:
- Each creature that canAttack MUST be included in the attacks array
- Creatures with frozen status CANNOT attack (skip them)
- If enemy has TAUNT creatures, those must be targeted first
- STEALTH creatures cannot be targeted
- Use "hero" as targetId to attack the enemy hero directly
- Make the narrative dramatic and fun! Describe each creature's attack with personality
- Build on battle history - reference grudges, revenge, heroic moments

IMPORTANT: Every creature that can attack should attack. The "attacks" array should have one entry per attacking creature.`

export function createCombatPhasePrompt(
  gameState: GameState,
  who: 'player' | 'opponent'
): string {
  const attacker = gameState[who]
  const defender = gameState[who === 'player' ? 'opponent' : 'player']

  const attackers = attacker.field
    .filter(c => c.canAttack && !c.statusEffects?.includes('frozen'))
    .map(formatCreature)
    .join(', ') || 'none'

  const defenders = defender.field.map(formatCreature).join(', ') || 'none'
  const tauntCreatures = defender.field
    .filter(c => c.statusEffects?.includes('taunt'))
    .map(c => c.instanceId)

  const battleHistory = formatBattleHistory(gameState.log)

  const tauntNote = tauntCreatures.length > 0
    ? `\nTAUNT creatures (must be attacked first): ${tauntCreatures.join(', ')}`
    : ''

  return `${battleHistory}Turn ${gameState.turn} - COMBAT PHASE for ${who === 'player' ? 'Hero' : 'Opponent'}!

Attacking creatures: ${attackers}
Enemy hero: ${defender.health}hp
Enemy creatures: ${defenders}${tauntNote}

Narrate all attacks dramatically and specify each creature's target.`
}
