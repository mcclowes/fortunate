# Test Coverage Analysis: Fortunate Card Game

## Executive Summary

**Current State: 0% Test Coverage**

The Fortunate codebase has **no test infrastructure** and **no test files**. This represents a significant risk for a 1,400 LOC codebase with complex game logic and AI integration.

---

## Codebase Overview

| Category | Files | Lines of Code | Priority |
|----------|-------|---------------|----------|
| Game Logic (`src/lib/`) | 4 files | ~580 LOC | **Critical** |
| API Routes (`src/app/api/`) | 3 files | ~260 LOC | **High** |
| React Components (`src/components/`) | 5 files | ~540 LOC | **Medium** |

---

## Priority 1: Core Game Logic (Critical)

### `src/lib/gameState.ts` - 306 lines

This file contains pure functions that are ideal for unit testing. Currently untested edge cases include:

#### Functions to Test

| Function | Lines | Risk Areas |
|----------|-------|------------|
| `createInitialGameState()` | 17-31 | Deck initialization, starting hands |
| `drawCard()` | 33-46 | Empty deck handling |
| `playCard()` | 48-81 | Insufficient mana, invalid index, creature summoning |
| `applyStateChanges()` | 83-152 | All state change types, edge cases |
| `creatureAttack()` | 260-306 | Combat resolution, creature death |
| `endTurn()` | 216-245 | Mana restoration, turn switching |

#### Recommended Test Cases

```typescript
// drawCard() tests
- Should move card from deck to hand
- Should not crash when deck is empty
- Should return unchanged state when deck is empty

// playCard() tests
- Should return null when card cost exceeds mana
- Should return null for invalid card index
- Should deduct mana correctly
- Should add creature to field when playing creature card
- Should not add spell to field
- Creature should have canAttack=false when first played

// applyStateChanges() tests
- damage: Should reduce player health (bounded at 0)
- damage: Should reduce opponent health (bounded at 0)
- damage: Should damage creatures and remove dead ones
- heal: Should increase health (bounded at 30)
- destroy: Should remove specific creature from field
- buff: Should increase creature attack AND health
- draw: Should draw multiple cards for player/opponent

// creatureAttack() tests
- Should mark attacker as having attacked (canAttack=false)
- Should deal damage to player/opponent hero
- Creature vs creature: both should take damage
- Dead creatures should be removed from field
- Should not allow attack if canAttack=false
- Should trigger win condition check

// endTurn() tests
- Should switch current player
- Should increment turn number only when returning to player
- Should restore mana (capped at 10)
- Should draw card for new active player
- Should refresh creatures (canAttack=true)
```

### `src/lib/cards.ts` - 157 lines

| Function | Test Needs |
|----------|------------|
| `shuffleDeck()` | Should return same cards in different order, should not mutate original |
| `createStarterDeck()` | Should contain all 18 cards, should be shuffled |
| `allCards` | Data validation - all creatures have baseStats, all cards have required fields |

---

## Priority 2: API Routes (High)

### `src/app/api/ai-turn/route.ts` - 82 lines

**Test Scenarios:**

```typescript
// Validation tests (mock AI responses)
- Should end turn when no playable cards and no attackers
- Should validate card index is within bounds
- Should validate card cost <= available mana
- Should validate attacker exists and can attack
- Should gracefully handle AI response parsing failures
- Should return fallback response on API errors

// Edge cases
- AI tries to play card with index -1
- AI tries to play card that costs more than available mana
- AI tries to attack with creature that doesn't exist
```

### `src/app/api/resolve/route.ts` - 80 lines

**Test Scenarios:**

```typescript
// SSE streaming tests
- Should stream text chunks correctly
- Should extract JSON from response
- Should handle malformed JSON gracefully
- Should return default response on parsing failure

// Integration tests (with mocked Anthropic client)
- Should call Claude with correct prompt structure
- Should return valid ResolveResponse structure
```

### `src/app/api/creature-action/route.ts` - 97 lines

**Test Scenarios:**

```typescript
// Action validation
- Should validate creature target exists
- Should handle attack_hero action
- Should handle attack_creature action
- Should handle special action with state changes
```

---

## Priority 3: React Components (Medium)

### `src/components/Board.tsx` - 387 lines

This is the main game controller with complex state management.

**Integration Test Scenarios:**

```typescript
// Game flow tests
- Should initialize with correct starting state
- Should prevent actions during opponent's turn
- Should prevent actions while loading
- Should handle card play -> resolve -> state update flow
- Should handle creature attack flow
- Should display game over modal when game ends
- Should reset game on "New Game" click

// SSE parsing tests
- parseSSEStream should handle partial chunks
- parseSSEStream should accumulate streaming text
- parseSSEStream should extract final result
```

### `src/components/Hand.tsx` - 32 lines

```typescript
// Render tests
- Should render correct number of cards
- Should mark cards as playable when cost <= mana
- Should mark cards as unplayable when cost > mana
- Should hide opponent hand details
- Should call onPlayCard with correct index when clicked
```

### `src/components/Field.tsx` - 46 lines

```typescript
// Render tests
- Should render all creatures
- Should show "No creatures" when field is empty
- Should mark creatures with canAttack=true as active
- Should call onCreatureClick with correct instanceId
```

### `src/components/Card.tsx` - 47 lines

```typescript
// Render tests
- Should display card name and cost
- Should show stats for creatures
- Should show "Spell" badge for spell cards
- Should apply correct CSS classes for state
```

---

## Missing Test Infrastructure

The following needs to be added to `package.json`:

```json
{
  "devDependencies": {
    "vitest": "^3.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "jsdom": "^25.0.0"
  },
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## Specific Bug-Prone Areas

### 1. Mana Cap Logic
The mana system has multiple places where `Math.min(10, ...)` is applied. Inconsistency could cause bugs:
- `endTurn()` line 219: `newMaxMana = Math.min(10, ...)`
- `endTurn()` line 227: `mana: Math.min(10, ps.maxMana + 1)`

**Test needed:** Verify mana never exceeds 10 in any scenario.

### 2. Health Bounds
- Damage is bounded at 0: `Math.max(0, health - damage)`
- Healing is bounded at 30: `Math.min(30, health + heal)`
- But `creatureAttack()` (line 288) does NOT bound health: `health: health - attack`

**Test needed:** Verify health bounds are consistent across all damage sources.

### 3. Instance ID Collisions
Creatures get instanceId via `${card.id}-${Date.now()}`. Two creatures played in the same millisecond would have the same ID.

**Test needed:** Verify creature identification works correctly.

### 4. Win Condition Timing
`checkWinCondition()` is called in `applyStateChanges()` and `creatureAttack()`, but the Board component also checks health manually (lines 152-156).

**Test needed:** Verify win detection is consistent and not duplicated.

### 5. SSE Parsing
`parseSSEStream()` in Board.tsx assumes clean line breaks. Chunked responses might split mid-line.

**Test needed:** Verify parsing handles partial/split chunks correctly.

---

## Recommended Test Implementation Order

1. **Phase 1: Unit Tests for Game Logic**
   - `gameState.test.ts` - All pure functions
   - `cards.test.ts` - Deck utilities and card data validation
   - Estimated: 50-70 test cases

2. **Phase 2: API Route Integration Tests**
   - Mock the Anthropic SDK
   - Test request validation and error handling
   - Test SSE streaming behavior
   - Estimated: 20-30 test cases

3. **Phase 3: Component Tests**
   - Use React Testing Library
   - Focus on user interactions and state changes
   - Estimated: 30-40 test cases

4. **Phase 4: E2E Tests (Optional)**
   - Full game flow simulation
   - Consider Playwright or Cypress
   - Estimated: 10-15 test scenarios

---

## Coverage Goals

| Phase | Target Coverage | Priority |
|-------|-----------------|----------|
| 1 | 90% of `src/lib/` | Critical |
| 2 | 80% of `src/app/api/` | High |
| 3 | 70% of `src/components/` | Medium |

---

## Summary of Gaps

| Risk Level | Area | Issue |
|------------|------|-------|
| **Critical** | Game Logic | No unit tests for core state management |
| **Critical** | Win Conditions | Untested edge cases around game ending |
| **High** | API Validation | AI responses not validated comprehensively |
| **High** | Error Handling | Fallback behaviors untested |
| **Medium** | Component State | Complex state machine in Board.tsx untested |
| **Medium** | SSE Parsing | Edge cases in stream parsing untested |
| **Low** | UI Rendering | Component render outputs not verified |
