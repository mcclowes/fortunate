'use client'

import { Card as CardType } from '@/lib/types'
import Card from './Card'
import styles from '@/styles/Hand.module.scss'

type HandProps = {
  cards: CardType[]
  mana: number
  isOpponent?: boolean
  onPlayCard?: (index: number) => void
}

export default function Hand({ cards, mana, isOpponent, onPlayCard }: HandProps) {
  return (
    <div className={`${styles.hand} ${isOpponent ? styles.opponent : ''}`}>
      {cards.map((card, index) => {
        const isPlayable = !isOpponent && card.cost <= mana
        return (
          <div key={`${card.id}-${index}`} className={styles.handCard}>
            <Card
              card={card}
              playable={isPlayable}
              isOpponent={isOpponent}
              onClick={isPlayable ? () => onPlayCard?.(index) : undefined}
            />
          </div>
        )
      })}
    </div>
  )
}
