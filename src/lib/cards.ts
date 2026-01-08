import { Card, TargetType } from './types'

// Icons from game-icons.net (CC BY 3.0 license)
// Format: https://game-icons.net/icons/{foreground}/{background}/1x1/{author}/{icon}.svg
const ICON_BASE = 'https://game-icons.net/icons/ffffff/transparent/1x1'

export const allCards: Card[] = [
  // Creatures
  {
    id: 'slightly-damp-towel',
    name: 'Slightly Damp Towel',
    flavor: 'It\'s not much, but it\'s honest work. Surprisingly effective against fire-based threats.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/droplet.svg`,
    baseStats: { attack: 1, health: 2 }
  },
  {
    id: 'ancient-dragon',
    name: 'Ancient Dragon',
    flavor: 'Has seen civilizations rise and fall. Mostly just wants a nap these days.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/dragon-head.svg`,
    baseStats: { attack: 7, health: 7 }
  },
  {
    id: 'confused-wizard',
    name: 'Confused Wizard',
    flavor: 'Wait, was it "fireball" or "furball"? The results vary dramatically.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/wizard-staff.svg`,
    baseStats: { attack: 2, health: 4 }
  },
  {
    id: 'angry-squirrel',
    name: 'Angry Squirrel',
    flavor: 'You ate the last acorn. You will pay.',
    type: 'creature',
    image: `${ICON_BASE}/delapouite/squirrel.svg`,
    baseStats: { attack: 2, health: 1 }
  },
  {
    id: 'time-lost-knight',
    name: 'Time-Lost Knight',
    flavor: 'Arrived late to every battle in history. Still somehow wins.',
    type: 'creature',
    image: `${ICON_BASE}/delapouite/black-knight-helm.svg`,
    baseStats: { attack: 4, health: 4 }
  },
  {
    id: 'philosophical-crab',
    name: 'Philosophical Crab',
    flavor: 'Ponders the meaning of sideways movement. Very hard to argue with.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/crab.svg`,
    baseStats: { attack: 1, health: 4 }
  },
  {
    id: 'enthusiastic-goblin',
    name: 'Enthusiastic Goblin',
    flavor: 'Doesn\'t know what\'s happening but is VERY excited about it.',
    type: 'creature',
    image: `${ICON_BASE}/caro-asercion/goblin.svg`,
    baseStats: { attack: 3, health: 2 }
  },
  {
    id: 'sleepy-giant',
    name: 'Sleepy Giant',
    flavor: 'Hits hard when awake. Rarely awake.',
    type: 'creature',
    image: `${ICON_BASE}/delapouite/ogre.svg`,
    baseStats: { attack: 8, health: 4 }
  },
  {
    id: 'mirror-mimic',
    name: 'Mirror Mimic',
    flavor: 'Copies whatever it sees. Currently very confused by itself.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/spectre.svg`,
    baseStats: { attack: 2, health: 2 }
  },
  {
    id: 'cursed-accountant',
    name: 'Cursed Accountant',
    flavor: 'Deals in debts of the soul. Also regular debts.',
    type: 'creature',
    image: `${ICON_BASE}/delapouite/abacus.svg`,
    baseStats: { attack: 3, health: 5 }
  },

  // Spells
  // targetType: 'none' = general effect, 'enemy_creature' = must target enemy creature,
  // 'any_creature' = can target any creature, 'friendly_creature' = targets own creature
  {
    id: 'suspicious-fog',
    name: 'Suspicious Fog',
    flavor: 'It\'s definitely hiding something. What, exactly, remains unclear.',
    type: 'spell',
    image: `${ICON_BASE}/lorc/fog.svg`,
    targetType: 'none'
  },
  {
    id: 'definitely-not-a-trap',
    name: 'Definitely Not a Trap',
    flavor: 'Trust us. Would this card lie to you?',
    type: 'spell',
    image: `${ICON_BASE}/lorc/bear-trap.svg`,
    targetType: 'none'
  },
  {
    id: 'minor-inconvenience',
    name: 'Minor Inconvenience',
    flavor: 'Their shoelace is untied. Their coffee is cold. Their day is ruined.',
    type: 'spell',
    image: `${ICON_BASE}/lorc/broken-heart.svg`,
    targetType: 'enemy_creature'
  },
  {
    id: 'chaos-ensues',
    name: 'Chaos Ensues',
    flavor: 'Something happens. No one knows what. Results may vary.',
    type: 'spell',
    image: `${ICON_BASE}/lorc/tornado.svg`,
    targetType: 'none'
  },
  {
    id: 'aggressive-negotiations',
    name: 'Aggressive Negotiations',
    flavor: 'Diplomacy, but louder and with more fire.',
    type: 'spell',
    image: `${ICON_BASE}/lorc/crossed-swords.svg`,
    targetType: 'enemy_creature'
  },
  {
    id: 'reality-hiccup',
    name: 'Reality Hiccup',
    flavor: 'The universe blinks. Things are different now.',
    type: 'spell',
    image: `${ICON_BASE}/lorc/magic-swirl.svg`,
    targetType: 'none'
  },
  {
    id: 'sudden-inspiration',
    name: 'Sudden Inspiration',
    flavor: 'A brilliant idea strikes! Literally. It hurts a bit.',
    type: 'spell',
    image: `${ICON_BASE}/delapouite/idea.svg`,
    targetType: 'none'
  },
  {
    id: 'borrowed-time',
    name: 'Borrowed Time',
    flavor: 'Take now, pay later. Interest rates are cosmic.',
    type: 'spell',
    image: `${ICON_BASE}/lorc/hourglass.svg`,
    targetType: 'none'
  },

  // New cards showcasing expanded mechanics

  // Freeze/Status cards
  {
    id: 'winter-sprite',
    name: 'Winter Sprite',
    flavor: 'Brings a chill to any conversation. Literally.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/frozen-orb.svg`,
    baseStats: { attack: 1, health: 3 }
  },
  {
    id: 'glacial-blast',
    name: 'Glacial Blast',
    flavor: 'Brain freeze, but for your whole body.',
    type: 'spell',
    image: `${ICON_BASE}/lorc/ice-bolt.svg`,
    targetType: 'enemy_creature'
  },

  // Poison cards
  {
    id: 'venomous-toadstool',
    name: 'Venomous Toadstool',
    flavor: 'Tastes like regret and poor life choices.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/spotted-mushroom.svg`,
    baseStats: { attack: 1, health: 2 }
  },
  {
    id: 'plague-of-papercuts',
    name: 'Plague of Papercuts',
    flavor: 'Death by a thousand tiny inconveniences.',
    type: 'spell',
    image: `${ICON_BASE}/delapouite/paper-wound.svg`,
    targetType: 'enemy_creature'
  },

  // Taunt creature
  {
    id: 'stubborn-boulder',
    name: 'Stubborn Boulder',
    flavor: 'Has been sitting here for eons. Will not move for you.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/rock.svg`,
    baseStats: { attack: 1, health: 6 }
  },
  {
    id: 'provocative-mime',
    name: 'Provocative Mime',
    flavor: 'Says nothing. Angers everyone.',
    type: 'creature',
    image: `${ICON_BASE}/delapouite/mime.svg`,
    baseStats: { attack: 2, health: 5 }
  },

  // Stealth creature
  {
    id: 'shadow-ferret',
    name: 'Shadow Ferret',
    flavor: 'You\'ll never see it coming. Neither will your socks.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/paw-heart.svg`,
    baseStats: { attack: 4, health: 2 }
  },
  {
    id: 'invisible-accountant',
    name: 'Invisible Accountant',
    flavor: 'Does the math while no one\'s watching.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/invisible.svg`,
    baseStats: { attack: 2, health: 2 }
  },

  // Shield cards
  {
    id: 'magical-bubble',
    name: 'Magical Bubble',
    flavor: 'Pop-resistant, but not criticism-resistant.',
    type: 'spell',
    image: `${ICON_BASE}/lorc/bubble-field.svg`,
    targetType: 'friendly_creature'
  },
  {
    id: 'armored-armadillo',
    name: 'Armored Armadillo',
    flavor: 'Rolls into a ball at the first sign of danger. Or mild inconvenience.',
    type: 'creature',
    image: `${ICON_BASE}/delapouite/armadillo.svg`,
    baseStats: { attack: 2, health: 3 }
  },

  // Mana manipulation
  {
    id: 'mana-leech',
    name: 'Mana Leech',
    flavor: 'Feeds on magical energy. Very unpopular at wizard parties.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/leech.svg`,
    baseStats: { attack: 2, health: 2 }
  },
  {
    id: 'arcane-heist',
    name: 'Arcane Heist',
    flavor: 'Your mana is my mana. My mana is also my mana.',
    type: 'spell',
    image: `${ICON_BASE}/lorc/hand.svg`,
    targetType: 'none'
  },

  // Discard cards
  {
    id: 'memory-moth',
    name: 'Memory Moth',
    flavor: 'Eats thoughts like fabric. Mostly the good ones.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/moth.svg`,
    baseStats: { attack: 2, health: 3 }
  },
  {
    id: 'forgetfulness',
    name: 'Forgetfulness',
    flavor: 'What were we talking about? Who are you? Who am I?',
    type: 'spell',
    image: `${ICON_BASE}/lorc/brain-freeze.svg`,
    targetType: 'none'
  },

  // Mill cards
  {
    id: 'librarian-ghost',
    name: 'Librarian Ghost',
    flavor: 'Shhhh. Those books are overdue. Forever.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/ghost.svg`,
    baseStats: { attack: 2, health: 4 }
  },
  {
    id: 'paper-shredder',
    name: 'Paper Shredder',
    flavor: 'Your carefully crafted plans? Gone. Confetti now.',
    type: 'spell',
    image: `${ICON_BASE}/delapouite/paper-shredder.svg`,
    targetType: 'none'
  },

  // Steal cards
  {
    id: 'hypnotic-frog',
    name: 'Hypnotic Frog',
    flavor: 'Ribbit. You will obey. Ribbit.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/frog.svg`,
    baseStats: { attack: 2, health: 3 }
  },
  {
    id: 'mind-swap',
    name: 'Mind Swap',
    flavor: 'I\'ll take that. You can have... nothing.',
    type: 'spell',
    image: `${ICON_BASE}/lorc/brain.svg`,
    targetType: 'enemy_creature'
  },

  // Transform cards
  {
    id: 'chaotic-polymorph',
    name: 'Chaotic Polymorph',
    flavor: 'You wanted a dragon? Best I can do is a very confused sheep.',
    type: 'spell',
    image: `${ICON_BASE}/lorc/sheep.svg`,
    targetType: 'any_creature'
  },
  {
    id: 'witch-of-whims',
    name: 'Witch of Whims',
    flavor: 'Transforms enemies into frogs. Sometimes allies too. Oops.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/witch-face.svg`,
    baseStats: { attack: 3, health: 3 }
  },

  // Copy cards
  {
    id: 'echo-elemental',
    name: 'Echo Elemental',
    flavor: 'Repeats everything. Everything. EVERYTHING.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/echo-ripples.svg`,
    baseStats: { attack: 2, health: 2 }
  },
  {
    id: 'doppelganger-dust',
    name: 'Doppelganger Dust',
    flavor: 'Sprinkle on enemy, receive free copy. Side effects may include existential dread.',
    type: 'spell',
    image: `${ICON_BASE}/lorc/powder.svg`,
    targetType: 'any_creature'
  },

  // Bounce cards
  {
    id: 'temporal-turtle',
    name: 'Temporal Turtle',
    flavor: 'Slow but arrives before it left. Time is weird.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/turtle.svg`,
    baseStats: { attack: 1, health: 4 }
  },
  {
    id: 'return-to-sender',
    name: 'Return to Sender',
    flavor: 'Address unknown. No such creature. No such threat.',
    type: 'spell',
    image: `${ICON_BASE}/lorc/return-arrow.svg`,
    targetType: 'any_creature'
  },

  // Doomed creatures (high stats but die at end of turn)
  {
    id: 'desperate-demon',
    name: 'Desperate Demon',
    flavor: 'Summoned from the clearance abyss. No returns.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/daemon-skull.svg`,
    baseStats: { attack: 5, health: 5 }
  },
  {
    id: 'doomed-prophecy',
    name: 'Doomed Prophecy',
    flavor: 'The stars align to say: you\'re about to have a very bad day.',
    type: 'spell',
    image: `${ICON_BASE}/lorc/death-skull.svg`,
    targetType: 'enemy_creature'
  },

  // Summon token cards
  {
    id: 'rabbit-hat',
    name: 'Rabbit Hat',
    flavor: 'The classic trick! The rabbit isn\'t impressed either.',
    type: 'spell',
    image: `${ICON_BASE}/lorc/top-hat.svg`,
    targetType: 'none'
  },
  {
    id: 'swarm-caller',
    name: 'Swarm Caller',
    flavor: 'Has bees. Will share. You don\'t get a choice.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/beehive.svg`,
    baseStats: { attack: 2, health: 3 }
  },

// Card draw cards
  {
    id: 'curious-cat',
    name: 'Curious Cat',
    flavor: 'Knocked over your deck just to see what was inside.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/cat.svg`,
    baseStats: { attack: 1, health: 1 }
  },
  {
    id: 'knowledge-hoarder',
    name: 'Knowledge Hoarder',
    flavor: 'Collects facts like others collect coins. Equally useless in combat.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/raven.svg`,
    baseStats: { attack: 2, health: 3 }
  },
  {
    id: 'library-card',
    name: 'Library Card',
    flavor: 'The most powerful card of all. Grants access to infinite knowledge. And late fees.',
    type: 'spell',
    image: `${ICON_BASE}/delapouite/bookmarklet.svg`,
    targetType: 'none'
  },
  {
    id: 'eureka-moment',
    name: 'Eureka Moment',
    flavor: 'That feeling when you finally understand. Then immediately forget.',
    type: 'spell',
    image: `${ICON_BASE}/lorc/light-bulb.svg`,
    targetType: 'none'
  },
  {
    id: 'scroll-scrounger',
    name: 'Scroll Scrounger',
    flavor: 'One wizard\'s trash is another wizard\'s treasure. Mostly trash though.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/scroll-unfurled.svg`,
    baseStats: { attack: 1, health: 2 }
  },
  {
    id: 'desperate-research',
    name: 'Desperate Research',
    flavor: 'When the deadline looms, any source becomes valid. Even this one.',
    type: 'spell',
    image: `${ICON_BASE}/delapouite/bookshelf.svg`,
    targetType: 'none'
  },

  // Summoning-focused cards
  {
    id: 'necromancers-call',
    name: 'Necromancer\'s Call',
    flavor: 'The dead answer. They always do. They\'re not busy.',
    type: 'spell',
    image: `${ICON_BASE}/lorc/raise-zombie.svg`,
    targetType: 'none'
  },
  {
    id: 'goblin-war-drum',
    name: 'Goblin War Drum',
    flavor: 'WAAAGH! Or however goblins spell it.',
    type: 'spell',
    image: `${ICON_BASE}/delapouite/drum.svg`,
    targetType: 'none'
  },
  {
    id: 'spirit-medium',
    name: 'Spirit Medium',
    flavor: 'Talks to ghosts. They never shut up about the old days.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/crystal-ball.svg`,
    baseStats: { attack: 2, health: 4 }
  },
  {
    id: 'flame-conjurer',
    name: 'Flame Conjurer',
    flavor: 'Summons fire friends. They\'re warm but terrible huggers.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/flame.svg`,
    baseStats: { attack: 2, health: 2 }
  },
  {
    id: 'grove-guardian',
    name: 'Grove Guardian',
    flavor: 'Where they walk, forests follow. Slowly.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/oak.svg`,
    baseStats: { attack: 3, health: 4 }
  },
  {
    id: 'army-in-a-bottle',
    name: 'Army in a Bottle',
    flavor: 'Just add water. And chaos. Mostly chaos.',
    type: 'spell',
    image: `${ICON_BASE}/lorc/drink-me.svg`,
    targetType: 'none'
  },
  {
    id: 'portal-of-chaos',
    name: 'Portal of Chaos',
    flavor: 'Step right up! No refunds. No returns. No survivors guaranteed.',
    type: 'spell',
    image: `${ICON_BASE}/lorc/portal.svg`,
    targetType: 'none'
  },
  {
    id: 'wolf-mother',
    name: 'Wolf Mother',
    flavor: 'Her children are everywhere. And hungry.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/wolf-head.svg`,
    baseStats: { attack: 3, health: 3 }
  },
  {
    id: 'wisp-weaver',
    name: 'Wisp Weaver',
    flavor: 'Spins magical threads into tiny annoying friends.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/magic-palm.svg`,
    baseStats: { attack: 1, health: 3 }
  },
  {
    id: 'undead-horde',
    name: 'Undead Horde',
    flavor: 'They keep coming. The graveyard has a lot of residents.',
    type: 'spell',
    image: `${ICON_BASE}/lorc/graveyard.svg`,
    targetType: 'none'
  }
]

// Token creatures that can be summoned by effects (not in decks)
export const tokenCreatures: Card[] = [
  {
    id: 'rabbit-token',
    name: 'Magic Rabbit',
    flavor: 'Pulled from a hat. Confused but determined.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/rabbit.svg`,
    baseStats: { attack: 1, health: 1 },
    isToken: true
  },
  {
    id: 'bee-token',
    name: 'Angry Bee',
    flavor: 'Bzzzz. That\'s bee for "prepare to suffer."',
    type: 'creature',
    image: `${ICON_BASE}/lorc/bee.svg`,
    baseStats: { attack: 1, health: 1 },
    isToken: true
  },
  {
    id: 'sheep-token',
    name: 'Confused Sheep',
    flavor: 'Baa? This wasn\'t in the job description.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/sheep.svg`,
    baseStats: { attack: 1, health: 1 },
    isToken: true
  },
  {
    id: 'frog-token',
    name: 'Formerly Someone Else',
    flavor: 'Ribbit. (Translation: I used to be a dragon.)',
    type: 'creature',
    image: `${ICON_BASE}/lorc/frog.svg`,
    baseStats: { attack: 1, health: 1 },
    isToken: true
  },
  {
    id: 'skeleton-token',
    name: 'Spooky Skeleton',
    flavor: 'Rattles menacingly. Has no muscles. Concerning.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/skeleton.svg`,
    baseStats: { attack: 2, health: 1 },
    isToken: true
  },
  // New summoning tokens
  {
    id: 'spectral-knight-token',
    name: 'Spectral Knight',
    flavor: 'Still bound by honor. Also transparent.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/mounted-knight.svg`,
    baseStats: { attack: 2, health: 2 },
    isToken: true
  },
  {
    id: 'flame-imp-token',
    name: 'Flame Imp',
    flavor: 'Small, angry, and very flammable. Wait, inflammable?',
    type: 'creature',
    image: `${ICON_BASE}/lorc/imp.svg`,
    baseStats: { attack: 2, health: 1 },
    isToken: true
  },
  {
    id: 'treant-token',
    name: 'Treant',
    flavor: 'A tree that walks. Leaf it alone.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/trefoil-lily.svg`,
    baseStats: { attack: 2, health: 3 },
    isToken: true
  },
  {
    id: 'zombie-token',
    name: 'Shambling Zombie',
    flavor: 'Not fast, but very persistent. Like Monday mornings.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/shambling-zombie.svg`,
    baseStats: { attack: 2, health: 2 },
    isToken: true
  },
  {
    id: 'goblin-grunt-token',
    name: 'Goblin Grunt',
    flavor: 'Paid in shinies. Works for chaos.',
    type: 'creature',
    image: `${ICON_BASE}/caro-asercion/goblin-head.svg`,
    baseStats: { attack: 1, health: 1 },
    isToken: true
  },
  {
    id: 'wisp-token',
    name: 'Arcane Wisp',
    flavor: 'A fragment of pure magical energy. Pew pew.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/fluffy-swirl.svg`,
    baseStats: { attack: 1, health: 1 },
    isToken: true
  },
  {
    id: 'wolf-token',
    name: 'Spirit Wolf',
    flavor: 'Howls at both moons. Yes, both of them.',
    type: 'creature',
    image: `${ICON_BASE}/lorc/wolf-howl.svg`,
    baseStats: { attack: 2, health: 1 },
    isToken: true
  }
]

export function shuffleDeck(cards: Card[]): Card[] {
  const shuffled = [...cards]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function createStarterDeck(): Card[] {
  // Give each player a copy of all cards, shuffled (excluding tokens)
  return shuffleDeck([...allCards])
}

// Helper to get a random token for transform effects
export function getRandomToken(): Card {
  return tokenCreatures[Math.floor(Math.random() * tokenCreatures.length)]
}

// Helper to get a specific token by ID for summoning effects
export function getTokenById(id: string): Card | undefined {
  return tokenCreatures.find(t => t.id === id)
}

// Helper to get multiple random tokens (for multi-summon effects)
export function getRandomTokens(count: number): Card[] {
  const tokens: Card[] = []
  for (let i = 0; i < count; i++) {
    tokens.push(getRandomToken())
  }
  return tokens
}
