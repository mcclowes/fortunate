'use client'

import { useNarration } from '@/hooks/useNarration'
import styles from '@/styles/NarrationToggle.module.scss'

export default function NarrationToggle() {
  const { enabled, isPlaying, toggle, skip } = useNarration()

  return (
    <div className={styles.container}>
      <button
        className={`${styles.toggle} ${enabled ? styles.enabled : ''}`}
        onClick={toggle}
        title={enabled ? 'Disable narration' : 'Enable narration'}
      >
        <span className={styles.icon}>{enabled ? '🔊' : '🔇'}</span>
        <span className={styles.label}>{enabled ? 'Narration On' : 'Narration Off'}</span>
      </button>
      {enabled && isPlaying && (
        <button
          className={styles.skip}
          onClick={skip}
          title="Skip current narration"
        >
          ⏭️
        </button>
      )}
    </div>
  )
}
