import { GameState, Card, Creature, GameEvent, SpellTarget } from './types'

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

export const RESOLVE_SYSTEM_PROMPT = `Narrate card effects in a whimsical card game.

STRICT LENGTH LIMIT: Maximum 15 words. One punchy sentence. No flowery descriptions.
Reference battle history (grudges, revenge) but stay under 15 words.
Example good: "Wolf Mother howls, summoning wolves to avenge the fallen Crab."
Example bad: "Wolf Mother lets out a haunting howl that echoes across the battlefield. Spectral wolf tokens materialize around her, their translucent forms padding silently beside their fierce matriarch."

Respond with JSON only:
{"narrative": "What happens", "changes": [StateChange, ...]}

CRITICAL - Target meanings (from CASTER's perspective):
- "player" = the CASTER (whoever is playing the card)
- "opponent" = the ENEMY of the caster
So if the card damages enemies, use target: "opponent". If it heals the caster, use target: "player".

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
- {"type": "summon", "target": "player|opponent", "card": {id,name,flavor,type:"creature",baseStats:{attack,health},isToken:true}}

Available tokens for summoning (use these exact ids):
- rabbit-token (1/1) - Magic Rabbit
- bee-token (1/1) - Angry Bee
- skeleton-token (2/1) - Spooky Skeleton
- spectral-knight-token (2/2) - Spectral Knight
- flame-imp-token (2/1) - Flame Imp
- treant-token (2/3) - Treant
- zombie-token (2/2) - Shambling Zombie
- goblin-grunt-token (1/1) - Goblin Grunt
- wisp-token (1/1) - Arcane Wisp
- wolf-token (2/1) - Spirit Wolf

Summoning cards should summon thematic tokens (e.g., necromancer summons skeletons/zombies, nature cards summon treants).
- {"type": "steal_creature", "target": "creature", "targetId": "creature-id"}
- {"type": "transform", "target": "creature", "targetId": "id", "card": {creature-card}}
- {"type": "copy_creature", "target": "player|opponent", "targetId": "creature-to-copy"}
- {"type": "bounce", "target": "creature", "targetId": "creature-id"} (returns to hand)

Status effects: frozen (skip attack), poisoned (1 dmg/turn), taunt (must be attacked), stealth (untargetable), silenced (no abilities), doomed (dies end of turn)

Effect scale: Small effects = 1-2 damage/+1 buff. Medium effects = 2-3 damage or status. Big effects = 4-5 damage or multiple effects. Creatures already summoned - describe entry effects only.

Summoning scale: Small summoners = 1 token. Medium summoners = 1-2 tokens. Big summoners = 2-3 tokens. Creature summoners summon tokens as entry effect.`

export function createResolvePrompt(
  gameState: GameState,
  card: Card,
  who: 'player' | 'opponent',
  target?: SpellTarget
): string {
  const caster = gameState[who]
  const enemy = gameState[who === 'player' ? 'opponent' : 'player']
  const enemyCreatures = enemy.field.map(formatCreature).join(', ') || 'none'
  const friendlyCreatures = caster.field.map(formatCreature).join(', ') || 'none'
  const battleHistory = formatBattleHistory(gameState.log)

  // Build target info string if a target was specified
  let targetInfo = ''
  if (target && target.type === 'creature' && target.creatureId) {
    const targetField = target.who === 'player' ? gameState.player.field : gameState.opponent.field
    const targetCreature = targetField.find(c => c.instanceId === target.creatureId)
    if (targetCreature) {
      const isEnemyTarget = (who === 'player' && target.who === 'opponent') ||
                           (who === 'opponent' && target.who === 'player')
      targetInfo = `\nTARGET: ${targetCreature.name}[${targetCreature.instanceId}] (${isEnemyTarget ? 'enemy' : 'friendly'} creature) - The spell MUST affect this target!`
    }
  }

  return `${battleHistory}Turn ${gameState.turn} - ${who === 'player' ? 'Hero' : 'Opponent'} plays:
${card.name} (${card.type}): "${card.flavor}"
Caster: ${caster.health}hp, creatures: ${friendlyCreatures}
Enemy: ${enemy.health}hp, creatures: ${enemyCreatures}${targetInfo}
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
{"action": "attack_creature|attack_hero|special", "targetId": "id", "narrative": "max 10 words", "changes": []}

STRICT: Narrative must be under 10 words. Example: "Crab pinches the Knight for 2 damage."

70% attack, 30% personality-based special ability.

For special actions, use StateChange format:
- damage/heal/destroy/buff/debuff creatures
- apply_status with "status": "frozen|poisoned|taunt|stealth|silenced|doomed"
- add_shield, steal_creature, bounce, copy_creature
- summon tokens (summoner creatures like Spirit Medium, Flame Conjurer, Wolf Mother can summon thematic tokens)

Available tokens: rabbit-token, bee-token, skeleton-token, spectral-knight-token, flame-imp-token, treant-token, zombie-token, goblin-grunt-token, wisp-token, wolf-token

Note: Creatures with taunt MUST be attacked first. Stealthed creatures can't be targeted.

Reference battle history briefly - grudges, revenge, fallen allies - but keep it under 10 words.`

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
export const COMBAT_PHASE_SYSTEM_PROMPT = `Narrator for combat phase. All creatures attack automatically.

Respond with JSON only:
{"narrative": "One sentence, max 20 words", "attacks": [{"attackerId": "id", "targetId": "id-or-hero"}, ...]}

STRICT: Keep narrative to ONE sentence, max 20 words total. Example: "The wolves lunge at the hero while Crab snaps at the Knight."

Rules:
- Each creature that canAttack MUST be in attacks array
- Frozen creatures CANNOT attack
- TAUNT creatures must be targeted first
- STEALTH creatures cannot be targeted
- Use "hero" as targetId to attack enemy hero`

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
