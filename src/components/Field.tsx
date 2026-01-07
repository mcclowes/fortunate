'use client'

import { Creature } from '@/lib/types'
import Card from './Card'
import styles from '@/styles/Field.module.scss'

type FieldProps = {
  creatures: Creature[]
  isOpponent?: boolean
  isPlayerTurn?: boolean
  onCreatureClick?: (instanceId: string) => void
}

export default function Field({
  creatures,
  isOpponent,
  isPlayerTurn,
  onCreatureClick
}: FieldProps) {
  const classes = [
    styles.field,
    isOpponent ? styles.opponent : styles.player
  ].join(' ')

  return (
    <div className={classes}>
      {creatures.length === 0 ? (
        <span className={styles.empty}>No creatures</span>
      ) : (
        creatures.map((creature) => {
          const canAct = !isOpponent && isPlayerTurn && creature.canAttack
          return (
            <Card
              key={creature.instanceId}
              card={creature}
              onField
              canAttack={canAct}
              isOpponent={isOpponent}
              onClick={canAct ? () => onCreatureClick?.(creature.instanceId) : undefined}
            />
          )
        })
      )}
    </div>
  )
}
