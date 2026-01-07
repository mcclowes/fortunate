import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { GameState, Card, ResolveResponse } from '@/lib/types'
import { RESOLVE_SYSTEM_PROMPT, createResolvePrompt } from '@/lib/prompts'

const anthropic = new Anthropic()

export async function POST(request: NextRequest) {
  try {
    const { gameState, card, who, creatureInstanceId } = await request.json() as {
      gameState: GameState
      card: Card
      who: 'player' | 'opponent'
      creatureInstanceId?: string
    }

    const stream = await anthropic.messages.stream({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: createResolvePrompt(gameState, card, who, creatureInstanceId)
        }
      ],
      system: RESOLVE_SYSTEM_PROMPT
    })

    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        let fullText = ''

        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullText += event.delta.text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`))
          }
        }

        const jsonMatch = fullText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const result: ResolveResponse = JSON.parse(jsonMatch[0])

          // Transform targets based on who played the card
          // Claude generates targets from the caster's perspective (their "opponent" = their enemy)
          // But GameState uses fixed "player" = human, "opponent" = AI
          // So when AI plays a card, we need to swap the targets
          if (who === 'opponent' && result.changes) {
            result.changes = result.changes.map(change => {
              if (change.target === 'player') {
                return { ...change, target: 'opponent' as const }
              } else if (change.target === 'opponent') {
                return { ...change, target: 'player' as const }
              }
              return change
            })
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'result', ...result })}\n\n`))
        } else {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'result',
            narrative: 'The card shimmers with uncertain energy...',
            changes: []
          })}\n\n`))
        }

        controller.close()
      }
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (error) {
    console.error('Resolve error:', error instanceof Error ? error.message : error)

    const narrative = process.env.NODE_ENV === 'development' && error instanceof Error
      ? `The card fizzles... (${error.message})`
      : 'The card shimmers with uncertain energy...'

    return new Response(
      `data: ${JSON.stringify({ type: 'result', narrative, changes: [] })}\n\n`,
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache'
        }
      }
    )
  }
}
