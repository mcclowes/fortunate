'use client'

import { useEffect, useRef } from 'react'
import { GameEvent } from '@/lib/types'
import styles from '@/styles/GameLog.module.scss'

type GameLogProps = {
  events: GameEvent[]
}

export default function GameLog({ events }: GameLogProps) {
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [events])

  return (
    <div className={styles.log} ref={logRef}>
      {events.map((event, index) => (
        <div key={index} className={`${styles.entry} ${styles[event.actor]}`}>
          <div className={styles.turn}>Turn {event.turn}</div>
          <div className={styles.narrative}>{event.narrative}</div>
        </div>
      ))}
    </div>
  )
}
