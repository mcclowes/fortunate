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
  return (
    <div className={`${styles.hand} ${isOpponent ? styles.opponent : ''}`}>
      {cards.map((card, index) => {
        // Cards are playable if we're not the opponent and onPlayCard is provided
        const isPlayable = !isOpponent && !!onPlayCard
        return (
          <div key={`${card.id}-${index}`} className={styles.handCard}>
            <Card
              card={card}
              playable={isPlayable}
              isOpponent={isOpponent}
              onClick={isPlayable ? () => onPlayCard(index) : undefined}
            />
          </div>
        )
      })}
    </div>
  )
}
