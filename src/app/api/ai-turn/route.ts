import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { GameState, AITurnResponse } from '@/lib/types'
import { AI_TURN_SYSTEM_PROMPT, createAITurnPrompt } from '@/lib/prompts'

const anthropic = new Anthropic()

export async function POST(request: NextRequest) {
  try {
    const { gameState } = await request.json() as { gameState: GameState }

    // Check if AI has any playable cards or attackers
    const hasPlayableCards = gameState.opponent.hand.some(c => c.cost <= gameState.opponent.mana)
    const hasAttackers = gameState.opponent.field.some(c => c.canAttack)

    // If nothing to do, end turn immediately
    if (!hasPlayableCards && !hasAttackers) {
      return NextResponse.json({
        action: 'end_turn',
        narrative: 'Nothing more to do this turn...'
      } satisfies AITurnResponse)
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: createAITurnPrompt(gameState)
        }
      ],
      system: AI_TURN_SYSTEM_PROMPT
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    // Extract JSON from the response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const result: AITurnResponse = JSON.parse(jsonMatch[0])

    // Validate the action
    if (result.action === 'play') {
      const card = gameState.opponent.hand[result.cardIndex ?? -1]
      if (!card || card.cost > gameState.opponent.mana) {
        // Invalid play, end turn instead
        return NextResponse.json({
          action: 'end_turn',
          narrative: 'Hmm, that won\'t work. I end my turn.'
        } satisfies AITurnResponse)
      }
    }

    if (result.action === 'attack') {
      const attacker = gameState.opponent.field.find(c => c.instanceId === result.attackerId)
      if (!attacker || !attacker.canAttack) {
        // Invalid attack, end turn instead
        return NextResponse.json({
          action: 'end_turn',
          narrative: 'My minions are exhausted. I end my turn.'
        } satisfies AITurnResponse)
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('AI turn error:', error)

    // Fallback: try to play first affordable card or end turn
    return NextResponse.json({
      action: 'end_turn',
      narrative: 'The opponent contemplates deeply, then passes.'
    } satisfies AITurnResponse)
  }
}
