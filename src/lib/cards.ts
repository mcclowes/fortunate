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
  // Give each player a copy of all cards, shuffled
  return shuffleDeck([...allCards])
}
