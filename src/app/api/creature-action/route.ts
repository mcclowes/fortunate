import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { GameState, Creature, CreatureActionResponse } from '@/lib/types'
import { CREATURE_ACTION_SYSTEM_PROMPT, createCreatureActionPrompt } from '@/lib/prompts'

const anthropic = new Anthropic()

type CreatureActionRequest = {
  gameState: GameState
  creature: Creature
  owner: 'player' | 'opponent'
}

export async function POST(request: NextRequest) {
  try {
    const { gameState, creature, owner } = await request.json() as CreatureActionRequest

    const stream = await anthropic.messages.stream({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: createCreatureActionPrompt(creature, owner, gameState)
        }
      ],
      system: CREATURE_ACTION_SYSTEM_PROMPT
    })

    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        let fullText = ''

        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullText += event.delta.text
            // Stream partial text for UI feedback
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`))
          }
        }

        // Parse final JSON
        const jsonMatch = fullText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          let result: CreatureActionResponse = JSON.parse(jsonMatch[0])

          // Validate attack_creature has a valid target
          if (result.action === 'attack_creature') {
            const enemyField = owner === 'player' ? gameState.opponent.field : gameState.player.field
            const target = enemyField.find(c => c.instanceId === result.targetId)
            if (!target) {
              result = {
                action: 'attack_hero',
                narrative: `${creature.name} lunges forward, finding no creature to attack, and strikes the enemy hero instead!`
              }
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'result', ...result })}\n\n`))
        } else {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'result',
            action: 'attack_hero',
            narrative: 'The creature charges forward!'
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
    console.error('Creature action error:', error)

    return new Response(
      `data: ${JSON.stringify({
        type: 'result',
        action: 'attack_hero',
        narrative: 'The creature charges forward with wild abandon!'
      })}\n\n`,
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache'
        }
      }
    )
  }
}
