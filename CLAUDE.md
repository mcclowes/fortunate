# CLAUDE.md - AI Assistant Guide for Fortunate

## Project Overview

Fortunate is a whimsical AI-powered card game built with Next.js where players battle against a Claude AI opponent. The game features creative card effects, narrative-driven gameplay, and streaming AI responses for real-time feedback.

**Tech Stack:**
- Next.js 16.1.1 with App Router
- React 19.2.3 with TypeScript 5.9.3 (strict mode)
- Anthropic Claude API (`claude-3-5-haiku-latest`)
- SASS/SCSS Modules for styling

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment (copy and add your API key)
cp .env.local.example .env.local
# Add ANTHROPIC_API_KEY to .env.local

# Run development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Entry point (renders Board)
│   └── api/
│       ├── ai-turn/        # AI decision-making endpoint
│       ├── combat-phase/   # Combat phase resolution endpoint
│       ├── creature-action/# Creature action endpoint
│       ├── narrate/        # ElevenLabs voice narration endpoint
│       └── resolve/        # Card effect resolution endpoint
├── components/
│   ├── Board.tsx           # Main game container (~663 lines)
│   ├── Card.tsx            # Card component
│   ├── Field.tsx           # Creature field display
│   ├── GameLog.tsx         # Game event log sidebar
│   ├── Hand.tsx            # Player hand display
│   ├── NarrationToggle.tsx # Voice narration toggle control
│   └── ParticleEffect.tsx  # Visual particle effects
├── hooks/
│   └── useNarration.ts     # Voice narration hook
├── lib/
│   ├── cards.ts            # Card definitions (63 cards + 12 tokens)
│   ├── gameState.ts        # Game state management (~805 lines)
│   ├── narration.ts        # Narration utility functions
│   ├── prompts.ts          # Claude prompt templates
│   ├── sounds.ts           # Sound effect utilities
│   └── types.ts            # TypeScript type definitions
└── styles/
    └── *.module.scss       # Component-scoped styles
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/lib/types.ts` | All TypeScript interfaces (Card, Creature, GameState, StateChange, StatusEffect) |
| `src/lib/gameState.ts` | Pure functions for immutable state management |
| `src/lib/cards.ts` | Card pool definitions, tokens, and deck creation |
| `src/lib/prompts.ts` | Claude prompt engineering templates |
| `src/lib/narration.ts` | ElevenLabs voice narration integration |
| `src/components/Board.tsx` | Main game logic and UI orchestration |
| `src/hooks/useNarration.ts` | React hook for narration state and playback |
| `src/app/api/*/route.ts` | Server-side Claude API integration |

## Code Conventions

### State Management
- **Immutable updates only** - Never mutate state directly, always return new objects
- State functions in `gameState.ts` are pure functions
- All state changes go through `applyStateChanges()` for consistency

```typescript
// Correct pattern:
export function playCard(state: GameState, ...): GameState {
  return { ...state, /* changes */ }
}

// Never do:
state.player.hand.push(card) // Mutation!
```

### TypeScript
- Strict mode enabled - all types must be explicit
- Use path alias `@/*` for imports from `src/`
- Define interfaces in `types.ts` for shared types

### Components
- Client components marked with `'use client'`
- Use SCSS modules for styling (prevents naming conflicts)
- Props-based data flow with callback handlers

### API Routes
- Stream responses using Server-Sent Events for real-time UI
- Always validate Claude responses before applying to game state
- Include graceful fallbacks for parsing failures

## Game Architecture

### Game Flow
1. `createInitialGameState()` sets up players (30 health, 4 starting cards)
2. Player turn: play one card per turn, then creatures attack
3. Card effects resolved via `/api/resolve` with Claude narration
4. Combat phase via `/api/combat-phase` for creature attacks
5. AI opponent turn via `/api/ai-turn` for decisions
6. `endTurn()` transitions turns, draws a card, enables attacks
7. `checkWinCondition()` ends game when health reaches 0

Note: The game uses a "one card per turn" mechanic (`hasPlayedCard` flag) rather than a mana cost system.

### State Change Types
```typescript
type StateChange = {
  type:
    // Basic effects
    | 'damage'           // Deal damage to target
    | 'heal'             // Restore health to target
    | 'destroy'          // Instantly destroy creature
    | 'buff'             // Increase creature stats
    | 'debuff'           // Reduce creature stats
    | 'draw'             // Draw cards
    // Summoning
    | 'summon'           // Summon a token creature
    | 'discard'          // Discard cards from hand
    // Status effects
    | 'apply_status'     // Apply a status effect (frozen, poisoned, taunt, stealth, silenced, doomed)
    | 'remove_status'    // Remove a status effect
    // Defense
    | 'add_shield'       // Add shield to creature
    // Mill
    | 'mill'             // Remove cards from top of deck
    // Control
    | 'steal_creature'   // Take control of enemy creature
    | 'transform'        // Change creature into another
    | 'copy_creature'    // Create copy of a creature
    | 'bounce'           // Return creature to owner's hand
  target: 'player' | 'opponent' | 'creature'
  targetId?: string      // instanceId if targeting a creature
  value?: number
  attack?: number        // For buff/debuff
  health?: number        // For buff/debuff
  card?: Card            // For summon/transform/copy
  status?: StatusEffect  // For status effects
}
```

### Card Types
- **Creatures**: Have attack/health stats, persist on field, can attack once per turn
- **Spells**: One-time effects with optional targeting, resolved via Claude
- **Tokens**: Generated by effects (not in deck), marked with `isToken: true`

### Targeting Types
Spells can specify a `targetType`:
- `none` - No target needed (general board effect)
- `enemy_creature` - Must target enemy creature
- `friendly_creature` - Must target friendly creature
- `any_creature` - Can target any creature
- `any_hero` / `enemy_hero` - Hero targeting

### Status Effects
Creatures can have status effects:
- `frozen` - Cannot attack next turn
- `poisoned` - Takes 1 damage at start of each turn
- `taunt` - Must be attacked before hero
- `stealth` - Cannot be targeted until it attacks
- `silenced` - Abilities disabled
- `doomed` - Destroyed at end of turn

## Claude API Integration

### Four AI Roles
1. **Card Resolution** (`/api/resolve`) - Narrates effects, returns StateChange[]
2. **AI Turn Decisions** (`/api/ai-turn`) - Chooses card to play or pass
3. **Combat Phase** (`/api/combat-phase`) - Coordinates all creature attacks in a single phase
4. **Creature Actions** (`/api/creature-action`) - Individual creature attack decisions

### Prompt Structure
- System prompts define behavior rules and JSON response format
- User prompts provide current game context
- All responses must be valid JSON with specific schemas

### Streaming Pattern
```typescript
// Parse SSE stream for real-time text + final JSON
const parseSSEStream = async (response: Response, onText: (text: string) => void) => {
  // Read chunks, stream text deltas
  // Extract final JSON from complete response
}
```

## Styling Conventions

### CSS Variables (in globals.scss)
```scss
--bg-dark: #1a1a2e
--bg-medium: #16213e
--bg-light: #0f3460
--accent: #e94560
--accent-light: #ff6b6b
--text: #eee
--text-dim: #aaa
--mana: #4a9eff
--health: #4ade80
--attack: #f97316
--gold: #fbbf24
```

### Component States
- `.playable` - Gold border with glow (affordable cards)
- `.canAttack` - Green border with pulse (ready creatures)
- `.onField` - Reduced size for field cards
- `.opponent` - Darkened appearance

## Development Guidelines

### When Adding New Cards
1. Add card definition to `allCards[]` in `cards.ts`
2. Include: id, name, flavor, type, image URL, and baseStats (if creature)
3. For spells, specify `targetType` to define targeting requirements
4. Spell effects are resolved dynamically by Claude
5. For token creatures, add to `tokenCreatures[]` with `isToken: true`

### When Modifying Game Logic
1. Keep functions pure in `gameState.ts`
2. Add new StateChange types to `types.ts` if needed
3. Update `applyStateChanges()` to handle new change types
4. Ensure `checkWinCondition()` runs after state changes

### When Updating AI Behavior
1. Modify prompts in `prompts.ts`
2. Keep JSON response schemas consistent
3. Update response types in `types.ts`
4. Add validation in API routes for new response fields

## Common Tasks

### Adding a New Card
```typescript
// In cards.ts - Creature example
const newCreature: Card = {
  id: 'unique-creature-id',
  name: 'Card Name',
  flavor: 'Flavor text here',
  type: 'creature',
  image: `${ICON_BASE}/author/icon-name.svg`,
  baseStats: { attack: 2, health: 3 }
}

// Spell example with targeting
const newSpell: Card = {
  id: 'unique-spell-id',
  name: 'Spell Name',
  flavor: 'Spell flavor text',
  type: 'spell',
  image: `${ICON_BASE}/author/icon-name.svg`,
  targetType: 'enemy_creature'  // or 'none', 'any_creature', etc.
}
```

### Adding a New State Change
1. Add type to `StateChange` union in `types.ts`
2. Add case handler in `applyStateChanges()` in `gameState.ts`
3. Update prompts to allow Claude to return new change type

## Testing Notes

No formal testing framework is currently installed. The codebase is structured to support testing:
- Pure functions in `gameState.ts` are easily unit testable
- API routes are isolated handlers
- Components follow predictable props patterns

Recommended additions: Jest, React Testing Library, Playwright

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key for Claude access |
| `ELEVENLABS_API_KEY` | No | ElevenLabs API key for voice narration |
| `ELEVENLABS_VOICE_ID` | No | Custom voice ID (default: Rachel - 21m00Tcm4TlvDq8ikWAM) |

## Troubleshooting

### Common Issues
- **API errors**: Check ANTHROPIC_API_KEY is set correctly
- **Cards not playing**: Only one card can be played per turn (check `hasPlayedCard` flag)
- **Creatures can't attack**: They cannot attack the turn they're summoned
- **JSON parse errors**: Check Claude response format in API routes
- **Narration not working**: Ensure ELEVENLABS_API_KEY is set and the toggle is enabled
