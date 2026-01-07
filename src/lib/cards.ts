import { Card } from './types'

// Icons from game-icons.net (CC BY 3.0 license)
// Format: https://game-icons.net/icons/{foreground}/{background}/1x1/{author}/{icon}.svg
const ICON_BASE = 'https://game-icons.net/icons/ffffff/transparent/1x1'

export const allCards: Card[] = [
  // Creatures
  {
    id: 'slightly-damp-towel',
    name: 'Slightly Damp Towel',
    flavor: 'It\'s not much, but it\'s honest work. Surprisingly effective against fire-based threats.',
    cost: 1,
    type: 'creature',
    image: `${ICON_BASE}/lorc/droplet.svg`,
    baseStats: { attack: 1, health: 2 }
  },
  {
    id: 'ancient-dragon',
    name: 'Ancient Dragon',
    flavor: 'Has seen civilizations rise and fall. Mostly just wants a nap these days.',
    cost: 7,
    type: 'creature',
    image: `${ICON_BASE}/lorc/dragon-head.svg`,
    baseStats: { attack: 7, health: 7 }
  },
  {
    id: 'confused-wizard',
    name: 'Confused Wizard',
    flavor: 'Wait, was it "fireball" or "furball"? The results vary dramatically.',
    cost: 3,
    type: 'creature',
    image: `${ICON_BASE}/lorc/wizard-staff.svg`,
    baseStats: { attack: 2, health: 4 }
  },
  {
    id: 'angry-squirrel',
    name: 'Angry Squirrel',
    flavor: 'You ate the last acorn. You will pay.',
    cost: 1,
    type: 'creature',
    image: `${ICON_BASE}/delapouite/squirrel.svg`,
    baseStats: { attack: 2, health: 1 }
  },
  {
    id: 'time-lost-knight',
    name: 'Time-Lost Knight',
    flavor: 'Arrived late to every battle in history. Still somehow wins.',
    cost: 4,
    type: 'creature',
    image: `${ICON_BASE}/delapouite/black-knight-helm.svg`,
    baseStats: { attack: 4, health: 4 }
  },
  {
    id: 'philosophical-crab',
    name: 'Philosophical Crab',
    flavor: 'Ponders the meaning of sideways movement. Very hard to argue with.',
    cost: 2,
    type: 'creature',
    image: `${ICON_BASE}/lorc/crab.svg`,
    baseStats: { attack: 1, health: 4 }
  },
  {
    id: 'enthusiastic-goblin',
    name: 'Enthusiastic Goblin',
    flavor: 'Doesn\'t know what\'s happening but is VERY excited about it.',
    cost: 2,
    type: 'creature',
    image: `${ICON_BASE}/caro-asercion/goblin.svg`,
    baseStats: { attack: 3, health: 2 }
  },
  {
    id: 'sleepy-giant',
    name: 'Sleepy Giant',
    flavor: 'Hits hard when awake. Rarely awake.',
    cost: 5,
    type: 'creature',
    image: `${ICON_BASE}/delapouite/ogre.svg`,
    baseStats: { attack: 8, health: 4 }
  },
  {
    id: 'mirror-mimic',
    name: 'Mirror Mimic',
    flavor: 'Copies whatever it sees. Currently very confused by itself.',
    cost: 3,
    type: 'creature',
    image: `${ICON_BASE}/lorc/spectre.svg`,
    baseStats: { attack: 2, health: 2 }
  },
  {
    id: 'cursed-accountant',
    name: 'Cursed Accountant',
    flavor: 'Deals in debts of the soul. Also regular debts.',
    cost: 4,
    type: 'creature',
    image: `${ICON_BASE}/delapouite/abacus.svg`,
    baseStats: { attack: 3, health: 5 }
  },

  // Spells
  {
    id: 'suspicious-fog',
    name: 'Suspicious Fog',
    flavor: 'It\'s definitely hiding something. What, exactly, remains unclear.',
    cost: 2,
    type: 'spell',
    image: `${ICON_BASE}/lorc/fog.svg`
  },
  {
    id: 'definitely-not-a-trap',
    name: 'Definitely Not a Trap',
    flavor: 'Trust us. Would this card lie to you?',
    cost: 3,
    type: 'spell',
    image: `${ICON_BASE}/lorc/bear-trap.svg`
  },
  {
    id: 'minor-inconvenience',
    name: 'Minor Inconvenience',
    flavor: 'Their shoelace is untied. Their coffee is cold. Their day is ruined.',
    cost: 1,
    type: 'spell',
    image: `${ICON_BASE}/lorc/broken-heart.svg`
  },
  {
    id: 'chaos-ensues',
    name: 'Chaos Ensues',
    flavor: 'Something happens. No one knows what. Results may vary.',
    cost: 4,
    type: 'spell',
    image: `${ICON_BASE}/lorc/tornado.svg`
  },
  {
    id: 'aggressive-negotiations',
    name: 'Aggressive Negotiations',
    flavor: 'Diplomacy, but louder and with more fire.',
    cost: 3,
    type: 'spell',
    image: `${ICON_BASE}/lorc/crossed-swords.svg`
  },
  {
    id: 'reality-hiccup',
    name: 'Reality Hiccup',
    flavor: 'The universe blinks. Things are different now.',
    cost: 5,
    type: 'spell',
    image: `${ICON_BASE}/lorc/magic-swirl.svg`
  },
  {
    id: 'sudden-inspiration',
    name: 'Sudden Inspiration',
    flavor: 'A brilliant idea strikes! Literally. It hurts a bit.',
    cost: 2,
    type: 'spell',
    image: `${ICON_BASE}/delapouite/idea.svg`
  },
  {
    id: 'borrowed-time',
    name: 'Borrowed Time',
    flavor: 'Take now, pay later. Interest rates are cosmic.',
    cost: 3,
    type: 'spell',
    image: `${ICON_BASE}/lorc/hourglass.svg`
  },

  // New cards showcasing expanded mechanics

  // Freeze/Status cards
  {
    id: 'winter-sprite',
    name: 'Winter Sprite',
    flavor: 'Brings a chill to any conversation. Literally.',
    cost: 2,
    type: 'creature',
    image: `${ICON_BASE}/lorc/frozen-orb.svg`,
    baseStats: { attack: 1, health: 3 }
  },
  {
    id: 'glacial-blast',
    name: 'Glacial Blast',
    flavor: 'Brain freeze, but for your whole body.',
    cost: 2,
    type: 'spell',
    image: `${ICON_BASE}/lorc/ice-bolt.svg`
  },

  // Poison cards
  {
    id: 'venomous-toadstool',
    name: 'Venomous Toadstool',
    flavor: 'Tastes like regret and poor life choices.',
    cost: 2,
    type: 'creature',
    image: `${ICON_BASE}/lorc/spotted-mushroom.svg`,
    baseStats: { attack: 1, health: 2 }
  },
  {
    id: 'plague-of-papercuts',
    name: 'Plague of Papercuts',
    flavor: 'Death by a thousand tiny inconveniences.',
    cost: 3,
    type: 'spell',
    image: `${ICON_BASE}/delapouite/paper-wound.svg`
  },

  // Taunt creature
  {
    id: 'stubborn-boulder',
    name: 'Stubborn Boulder',
    flavor: 'Has been sitting here for eons. Will not move for you.',
    cost: 3,
    type: 'creature',
    image: `${ICON_BASE}/lorc/rock.svg`,
    baseStats: { attack: 1, health: 6 }
  },
  {
    id: 'provocative-mime',
    name: 'Provocative Mime',
    flavor: 'Says nothing. Angers everyone.',
    cost: 4,
    type: 'creature',
    image: `${ICON_BASE}/delapouite/mime.svg`,
    baseStats: { attack: 2, health: 5 }
  },

  // Stealth creature
  {
    id: 'shadow-ferret',
    name: 'Shadow Ferret',
    flavor: 'You\'ll never see it coming. Neither will your socks.',
    cost: 3,
    type: 'creature',
    image: `${ICON_BASE}/lorc/paw-heart.svg`,
    baseStats: { attack: 4, health: 2 }
  },
  {
    id: 'invisible-accountant',
    name: 'Invisible Accountant',
    flavor: 'Does the math while no one\'s watching.',
    cost: 2,
    type: 'creature',
    image: `${ICON_BASE}/lorc/invisible.svg`,
    baseStats: { attack: 2, health: 2 }
  },

  // Shield cards
  {
    id: 'magical-bubble',
    name: 'Magical Bubble',
    flavor: 'Pop-resistant, but not criticism-resistant.',
    cost: 2,
    type: 'spell',
    image: `${ICON_BASE}/lorc/bubble-field.svg`
  },
  {
    id: 'armored-armadillo',
    name: 'Armored Armadillo',
    flavor: 'Rolls into a ball at the first sign of danger. Or mild inconvenience.',
    cost: 3,
    type: 'creature',
    image: `${ICON_BASE}/delapouite/armadillo.svg`,
    baseStats: { attack: 2, health: 3 }
  },

  // Mana manipulation
  {
    id: 'mana-leech',
    name: 'Mana Leech',
    flavor: 'Feeds on magical energy. Very unpopular at wizard parties.',
    cost: 2,
    type: 'creature',
    image: `${ICON_BASE}/lorc/leech.svg`,
    baseStats: { attack: 2, health: 2 }
  },
  {
    id: 'arcane-heist',
    name: 'Arcane Heist',
    flavor: 'Your mana is my mana. My mana is also my mana.',
    cost: 3,
    type: 'spell',
    image: `${ICON_BASE}/lorc/hand.svg`
  },

  // Discard cards
  {
    id: 'memory-moth',
    name: 'Memory Moth',
    flavor: 'Eats thoughts like fabric. Mostly the good ones.',
    cost: 3,
    type: 'creature',
    image: `${ICON_BASE}/lorc/moth.svg`,
    baseStats: { attack: 2, health: 3 }
  },
  {
    id: 'forgetfulness',
    name: 'Forgetfulness',
    flavor: 'What were we talking about? Who are you? Who am I?',
    cost: 2,
    type: 'spell',
    image: `${ICON_BASE}/lorc/brain-freeze.svg`
  },

  // Mill cards
  {
    id: 'librarian-ghost',
    name: 'Librarian Ghost',
    flavor: 'Shhhh. Those books are overdue. Forever.',
    cost: 4,
    type: 'creature',
    image: `${ICON_BASE}/lorc/ghost.svg`,
    baseStats: { attack: 2, health: 4 }
  },
  {
    id: 'paper-shredder',
    name: 'Paper Shredder',
    flavor: 'Your carefully crafted plans? Gone. Confetti now.',
    cost: 3,
    type: 'spell',
    image: `${ICON_BASE}/delapouite/paper-shredder.svg`
  },

  // Steal cards
  {
    id: 'hypnotic-frog',
    name: 'Hypnotic Frog',
    flavor: 'Ribbit. You will obey. Ribbit.',
    cost: 5,
    type: 'creature',
    image: `${ICON_BASE}/lorc/frog.svg`,
    baseStats: { attack: 2, health: 3 }
  },
  {
    id: 'mind-swap',
    name: 'Mind Swap',
    flavor: 'I\'ll take that. You can have... nothing.',
    cost: 5,
    type: 'spell',
    image: `${ICON_BASE}/lorc/brain.svg`
  },

  // Transform cards
  {
    id: 'chaotic-polymorph',
    name: 'Chaotic Polymorph',
    flavor: 'You wanted a dragon? Best I can do is a very confused sheep.',
    cost: 4,
    type: 'spell',
    image: `${ICON_BASE}/lorc/sheep.svg`
  },
  {
    id: 'witch-of-whims',
    name: 'Witch of Whims',
    flavor: 'Transforms enemies into frogs. Sometimes allies too. Oops.',
    cost: 4,
    type: 'creature',
    image: `${ICON_BASE}/lorc/witch-face.svg`,
    baseStats: { attack: 3, health: 3 }
  },

  // Copy cards
  {
    id: 'echo-elemental',
    name: 'Echo Elemental',
    flavor: 'Repeats everything. Everything. EVERYTHING.',
    cost: 4,
    type: 'creature',
    image: `${ICON_BASE}/lorc/echo-ripples.svg`,
    baseStats: { attack: 2, health: 2 }
  },
  {
    id: 'doppelganger-dust',
    name: 'Doppelganger Dust',
    flavor: 'Sprinkle on enemy, receive free copy. Side effects may include existential dread.',
    cost: 4,
    type: 'spell',
    image: `${ICON_BASE}/lorc/powder.svg`
  },

  // Bounce cards
  {
    id: 'temporal-turtle',
    name: 'Temporal Turtle',
    flavor: 'Slow but arrives before it left. Time is weird.',
    cost: 3,
    type: 'creature',
    image: `${ICON_BASE}/lorc/turtle.svg`,
    baseStats: { attack: 1, health: 4 }
  },
  {
    id: 'return-to-sender',
    name: 'Return to Sender',
    flavor: 'Address unknown. No such creature. No such threat.',
    cost: 2,
    type: 'spell',
    image: `${ICON_BASE}/lorc/return-arrow.svg`
  },

  // Doomed creatures (high stats but die at end of turn)
  {
    id: 'desperate-demon',
    name: 'Desperate Demon',
    flavor: 'Summoned from the clearance abyss. No returns.',
    cost: 2,
    type: 'creature',
    image: `${ICON_BASE}/lorc/daemon-skull.svg`,
    baseStats: { attack: 5, health: 5 }
  },
  {
    id: 'doomed-prophecy',
    name: 'Doomed Prophecy',
    flavor: 'The stars align to say: you\'re about to have a very bad day.',
    cost: 3,
    type: 'spell',
    image: `${ICON_BASE}/lorc/death-skull.svg`
  },

  // Summon token cards
  {
    id: 'rabbit-hat',
    name: 'Rabbit Hat',
    flavor: 'The classic trick! The rabbit isn\'t impressed either.',
    cost: 2,
    type: 'spell',
    image: `${ICON_BASE}/lorc/top-hat.svg`
  },
  {
    id: 'swarm-caller',
    name: 'Swarm Caller',
    flavor: 'Has bees. Will share. You don\'t get a choice.',
    cost: 4,
    type: 'creature',
    image: `${ICON_BASE}/lorc/beehive.svg`,
    baseStats: { attack: 2, health: 3 }
  }
]

// Token creatures that can be summoned by effects (not in decks)
export const tokenCreatures: Card[] = [
  {
    id: 'rabbit-token',
    name: 'Magic Rabbit',
    flavor: 'Pulled from a hat. Confused but determined.',
    cost: 0,
    type: 'creature',
    image: `${ICON_BASE}/lorc/rabbit.svg`,
    baseStats: { attack: 1, health: 1 },
    isToken: true
  },
  {
    id: 'bee-token',
    name: 'Angry Bee',
    flavor: 'Bzzzz. That\'s bee for "prepare to suffer."',
    cost: 0,
    type: 'creature',
    image: `${ICON_BASE}/lorc/bee.svg`,
    baseStats: { attack: 1, health: 1 },
    isToken: true
  },
  {
    id: 'sheep-token',
    name: 'Confused Sheep',
    flavor: 'Baa? This wasn\'t in the job description.',
    cost: 0,
    type: 'creature',
    image: `${ICON_BASE}/lorc/sheep.svg`,
    baseStats: { attack: 1, health: 1 },
    isToken: true
  },
  {
    id: 'frog-token',
    name: 'Formerly Someone Else',
    flavor: 'Ribbit. (Translation: I used to be a dragon.)',
    cost: 0,
    type: 'creature',
    image: `${ICON_BASE}/lorc/frog.svg`,
    baseStats: { attack: 1, health: 1 },
    isToken: true
  },
  {
    id: 'skeleton-token',
    name: 'Spooky Skeleton',
    flavor: 'Rattles menacingly. Has no muscles. Concerning.',
    cost: 0,
    type: 'creature',
    image: `${ICON_BASE}/lorc/skeleton.svg`,
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
