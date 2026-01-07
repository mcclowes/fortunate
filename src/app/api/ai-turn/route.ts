import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { GameState, AITurnResponse } from '@/lib/types'
import { AI_TURN_SYSTEM_PROMPT, createAITurnPrompt } from '@/lib/prompts'

const anthropic = new Anthropic()

export async function POST(request: NextRequest) {
  try {
    const { gameState } = await request.json() as { gameState: GameState }

    // If no cards in hand, pass immediately
    if (gameState.opponent.hand.length === 0) {
      return NextResponse.json({
        action: 'pass',
        narrative: 'No cards to play...'
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
      if (!card) {
        // Invalid card index, pass instead
        return NextResponse.json({
          action: 'pass',
          narrative: 'Hmm, that won\'t work. I pass.'
        } satisfies AITurnResponse)
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('AI turn error:', error)

    // Fallback: pass
    return NextResponse.json({
      action: 'pass',
      narrative: 'The opponent contemplates deeply, then passes.'
    } satisfies AITurnResponse)
  }
}
