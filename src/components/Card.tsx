'use client'

import { Card as CardType, Creature } from '@/lib/types'
import styles from '@/styles/Card.module.scss'

type CardProps = {
  card: CardType | Creature
  playable?: boolean
  onField?: boolean
  canAttack?: boolean
  isOpponent?: boolean
  onClick?: () => void
}

function isCreatureInstance(card: CardType | Creature): card is Creature {
  return 'instanceId' in card
}

export default function Card({ card, playable, onField, canAttack, isOpponent, onClick }: CardProps) {
  const classes = [
    styles.card,
    card.type === 'creature' ? styles.creature : styles.spell,
    playable && styles.playable,
    onField && styles.onField,
    canAttack && styles.canAttack,
    isOpponent && styles.opponent
  ].filter(Boolean).join(' ')

  const attack = isCreatureInstance(card) ? card.currentAttack : card.baseStats?.attack
  const health = isCreatureInstance(card) ? card.currentHealth : card.baseStats?.health

  return (
    <div className={classes} onClick={onClick}>
      <div className={styles.cost}>{card.cost}</div>
      <div className={styles.name}>{card.name}</div>
      <div className={styles.flavor}>{card.flavor}</div>
      {card.type === 'creature' && attack !== undefined && health !== undefined ? (
        <div className={styles.stats}>
          <div className={styles.attack}>{attack}</div>
          <div className={styles.health}>{health}</div>
        </div>
      ) : (
        <div className={styles.spellBadge}>Spell</div>
      )}
    </div>
  )
}
