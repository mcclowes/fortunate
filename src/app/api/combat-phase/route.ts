import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { GameState, CombatPhaseResponse } from '@/lib/types'
import { COMBAT_PHASE_SYSTEM_PROMPT, createCombatPhasePrompt } from '@/lib/prompts'

const anthropic = new Anthropic()

type CombatPhaseRequest = {
  gameState: GameState
  who: 'player' | 'opponent'
}

export async function POST(request: NextRequest) {
  try {
    const { gameState, who } = await request.json() as CombatPhaseRequest

    // Check if there are any creatures that can attack
    const attackers = gameState[who].field.filter(
      c => c.canAttack && !c.statusEffects?.includes('frozen')
    )

    if (attackers.length === 0) {
      // No creatures to attack, return empty response
      return new Response(
        `data: ${JSON.stringify({
          type: 'result',
          narrative: '',
          attacks: []
        })}\n\n`,
        {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache'
          }
        }
      )
    }

    const stream = await anthropic.messages.stream({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: createCombatPhasePrompt(gameState, who)
        }
      ],
      system: COMBAT_PHASE_SYSTEM_PROMPT
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

        // Parse final JSON
        const jsonMatch = fullText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const result: CombatPhaseResponse = JSON.parse(jsonMatch[0])

          // Validate attacks - make sure each attacker is valid
          const enemy = who === 'player' ? 'opponent' : 'player'
          const validatedAttacks = result.attacks
            .filter(attack => {
              const attacker = gameState[who].field.find(c => c.instanceId === attack.attackerId)
              return attacker && attacker.canAttack && !attacker.statusEffects?.includes('frozen')
            })
            .map(attack => {
              // Validate target
              if (attack.targetId === 'hero') {
                // Check for taunt - if enemy has taunt, can't attack hero
                const tauntCreatures = gameState[enemy].field.filter(
                  c => c.statusEffects?.includes('taunt')
                )
                if (tauntCreatures.length > 0) {
                  return { ...attack, targetId: tauntCreatures[0].instanceId }
                }
                return attack
              }
              // Validate creature target exists and isn't stealthed
              const target = gameState[enemy].field.find(c => c.instanceId === attack.targetId)
              if (!target || target.statusEffects?.includes('stealth')) {
                return { ...attack, targetId: 'hero' }
              }
              return attack
            })

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'result',
            narrative: result.narrative,
            attacks: validatedAttacks
          })}\n\n`))
        } else {
          // Fallback: all attackers go face
          const fallbackAttacks = attackers.map(c => ({
            attackerId: c.instanceId,
            targetId: 'hero' as const
          }))

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'result',
            narrative: 'The creatures charge forward with wild abandon!',
            attacks: fallbackAttacks
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
    console.error('Combat phase error:', error)

    return new Response(
      `data: ${JSON.stringify({
        type: 'result',
        narrative: 'The creatures surge forward!',
        attacks: []
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
