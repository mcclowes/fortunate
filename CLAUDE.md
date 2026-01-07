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
│       ├── resolve/        # Card effect resolution endpoint
│       └── creature-action/# Creature action endpoint
├── components/
│   ├── Board.tsx           # Main game container (~388 lines)
│   ├── Hand.tsx            # Player hand display
│   ├── Field.tsx           # Creature field display
│   ├── Card.tsx            # Card component
│   └── GameLog.tsx         # Game event log sidebar
├── lib/
│   ├── types.ts            # TypeScript type definitions
│   ├── gameState.ts        # Game state management (~306 lines)
│   ├── cards.ts            # Card definitions (18 cards)
│   └── prompts.ts          # Claude prompt templates
└── styles/
    └── *.module.scss       # Component-scoped styles
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/lib/types.ts` | All TypeScript interfaces (Card, Creature, GameState, StateChange) |
| `src/lib/gameState.ts` | Pure functions for immutable state management |
| `src/lib/cards.ts` | Card pool definitions and deck creation |
| `src/lib/prompts.ts` | Claude prompt engineering templates |
| `src/components/Board.tsx` | Main game logic and UI orchestration |
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
1. `createInitialGameState()` sets up players (30 health, 1 mana, 4 cards)
2. Player turn: play cards, activate creatures, or end turn
3. Card effects resolved via `/api/resolve` with Claude narration
4. Creature actions via `/api/creature-action` with personality
5. AI opponent turn via `/api/ai-turn` for decisions
6. `endTurn()` transitions turns, increments mana, enables attacks
7. `checkWinCondition()` ends game when health reaches 0

### State Change Types
```typescript
type StateChange =
  | { type: 'damage'; target: 'player' | 'opponent'; amount: number }
  | { type: 'heal'; target: 'player' | 'opponent'; amount: number }
  | { type: 'damage_creature'; who: 'player' | 'opponent'; creatureIndex: number; amount: number }
  | { type: 'buff_creature'; who: 'player' | 'opponent'; creatureIndex: number; attack?: number; health?: number }
  | { type: 'destroy_creature'; who: 'player' | 'opponent'; creatureIndex: number }
  | { type: 'summon'; who: 'player' | 'opponent'; card: Card }
  | { type: 'draw'; who: 'player' | 'opponent'; count: number }
```

### Card Types
- **Creatures**: Have attack/health stats, persist on field, can attack once per turn
- **Spells**: One-time effects, resolved immediately via Claude

## Claude API Integration

### Three AI Roles
1. **Card Resolution** (`/api/resolve`) - Narrates effects, returns StateChange[]
2. **AI Turn Decisions** (`/api/ai-turn`) - Chooses card to play or end turn
3. **Creature Actions** (`/api/creature-action`) - Determines attack target or special ability

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
--bg-darker: #0f0f1a
--accent: #e94560
--card-bg: #16213e
--text: #eee
--mana: #4ea8de
--health: #e63946
--attack: #f4a261
```

### Component States
- `.playable` - Gold border with glow (affordable cards)
- `.canAttack` - Green border with pulse (ready creatures)
- `.onField` - Reduced size for field cards
- `.opponent` - Darkened appearance

## Development Guidelines

### When Adding New Cards
1. Add card definition to `allCards[]` in `cards.ts`
2. Include: name, flavor, cost, type, and stats (if creature)
3. Spell effects are resolved dynamically by Claude

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

### Adding a New Card Type
```typescript
// In cards.ts
const newCard: Card = {
  name: "Card Name",
  flavor: "Flavor text here",
  cost: 3,
  type: 'creature', // or 'spell'
  attack: 2,        // creatures only
  health: 3,        // creatures only
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

## Troubleshooting

### Common Issues
- **API errors**: Check ANTHROPIC_API_KEY is set correctly
- **Cards not playing**: Verify mana cost doesn't exceed current mana
- **Creatures can't attack**: They cannot attack the turn they're summoned
- **JSON parse errors**: Check Claude response format in API routes
