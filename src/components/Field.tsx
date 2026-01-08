'use client'

import { Creature } from '@/lib/types'
import Card from './Card'
import styles from '@/styles/Field.module.scss'

type FieldProps = {
  creatures: Creature[]
  isOpponent?: boolean
  isPlayerTurn?: boolean
  onCreatureClick?: (instanceId: string) => void
  isTargeting?: boolean
  validTargetIds?: string[]
}

export default function Field({
  creatures,
  isOpponent,
  isPlayerTurn,
  onCreatureClick,
  isTargeting,
  validTargetIds
}: FieldProps) {
  const classes = [
    styles.field,
    isOpponent ? styles.opponent : styles.player,
    isTargeting ? styles.targeting : ''
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      {creatures.length === 0 ? (
        <span className={styles.empty}>No creatures</span>
      ) : (
        creatures.map((creature) => {
          const canAct = !isOpponent && isPlayerTurn && creature.canAttack
          const isValidTarget = isTargeting && validTargetIds?.includes(creature.instanceId)
          const isClickable = isValidTarget || canAct

          return (
            <Card
              key={creature.instanceId}
              card={creature}
              onField
              canAttack={canAct && !isTargeting}
              isOpponent={isOpponent}
              isValidTarget={isValidTarget}
              onClick={isClickable ? () => onCreatureClick?.(creature.instanceId) : undefined}
            />
          )
        })
      )}
    </div>
  )
}
