'use client'

import { Card as CardType } from '@/lib/types'
import Card from './Card'
import styles from '@/styles/Hand.module.scss'

type HandProps = {
  cards: CardType[]
  isOpponent?: boolean
  onPlayCard?: (index: number) => void
}

export default function Hand({ cards, isOpponent, onPlayCard }: HandProps) {
  // Show card backs for opponent's hand
  if (isOpponent) {
    return (
      <div className={`${styles.hand} ${styles.opponent}`}>
        {cards.map((_, index) => (
          <div key={index} className={styles.cardBack}>
            <span className={styles.cardBackIcon}>?</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={styles.hand}>
      {cards.map((card, index) => {
        const isPlayable = !!onPlayCard
        return (
          <div key={`${card.id}-${index}`} className={styles.handCard}>
            <Card
              card={card}
              playable={isPlayable}
              onClick={isPlayable ? () => onPlayCard(index) : undefined}
            />
          </div>
        )
      })}
    </div>
  )
}
