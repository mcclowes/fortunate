'use client'

import { useState, useRef, useCallback } from 'react'
import { Card as CardType, Creature, StatusEffect } from '@/lib/types'
import styles from '@/styles/Card.module.scss'

type CardProps = {
  card: CardType | Creature
  playable?: boolean
  onField?: boolean
  canAttack?: boolean
  isOpponent?: boolean
  isValidTarget?: boolean
  onClick?: () => void
}

function isCreatureInstance(card: CardType | Creature): card is Creature {
  return 'instanceId' in card
}

// Map status effects to emoji indicators
const statusIcons: Record<StatusEffect, string> = {
  frozen: '❄️',
  poisoned: '☠️',
  taunt: '🛡️',
  stealth: '👻',
  silenced: '🤫',
  doomed: '💀'
}

export default function Card({ card, playable, onField, canAttack, isOpponent, isValidTarget, onClick }: CardProps) {
  const [showPreview, setShowPreview] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const hoverTimer = useRef<NodeJS.Timeout | null>(null)

  const isCreature = isCreatureInstance(card)
  const hasStatusEffects = isCreature && card.statusEffects && card.statusEffects.length > 0
  const hasShield = isCreature && card.shield && card.shield > 0
  const isToken = card.isToken

  const classes = [
    styles.card,
    card.type === 'creature' ? styles.creature : styles.spell,
    playable && styles.playable,
    onField && styles.onField,
    canAttack && styles.canAttack,
    isOpponent && styles.opponent,
    isValidTarget && styles.validTarget,
    isCreature && card.statusEffects?.includes('frozen') && styles.frozen,
    isCreature && card.statusEffects?.includes('poisoned') && styles.poisoned,
    isCreature && card.statusEffects?.includes('taunt') && styles.taunt,
    isCreature && card.statusEffects?.includes('stealth') && styles.stealth,
    isCreature && card.statusEffects?.includes('doomed') && styles.doomed,
    hasShield && styles.shielded,
    isToken && styles.token
  ].filter(Boolean).join(' ')

  const attack = isCreatureInstance(card) ? card.currentAttack : card.baseStats?.attack
  const health = isCreatureInstance(card) ? card.currentHealth : card.baseStats?.health
  const shield = isCreatureInstance(card) ? card.shield : undefined

  // Desktop hover handlers
  const handleMouseEnter = useCallback(() => {
    hoverTimer.current = setTimeout(() => {
      setShowPreview(true)
    }, 300)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current)
      hoverTimer.current = null
    }
    setShowPreview(false)
  }, [])

  // Mobile long-press handlers
  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setShowPreview(true)
    }, 400)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    // Delay hiding to allow user to see the preview
    if (showPreview) {
      setTimeout(() => setShowPreview(false), 100)
    }
  }, [showPreview])

  const handlePreviewClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowPreview(false)
  }, [])

  return (
    <div
      className={classes}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={styles.name}>{card.name}</div>
      {card.image && (
        <div className={styles.imageContainer}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={card.image} alt={card.name} className={styles.image} />
        </div>
      )}
      <div className={styles.flavor}>{card.flavor}</div>

      {/* Status effect indicators */}
      {hasStatusEffects && (
        <div className={styles.statusEffects}>
          {card.statusEffects!.map((status) => (
            <span key={status} className={styles.statusIcon} title={status}>
              {statusIcons[status]}
            </span>
          ))}
        </div>
      )}

      {card.type === 'creature' && attack !== undefined && health !== undefined ? (
        <div className={styles.stats}>
          <div className={styles.attack}>{attack}</div>
          <div className={styles.healthContainer}>
            {hasShield && (
              <div className={styles.shield} title={`Shield: ${shield}`}>
                🛡️{shield}
              </div>
            )}
            <div className={styles.health}>{health}</div>
          </div>
        </div>
      ) : (
        <div className={styles.spellBadge}>Spell</div>
      )}

      {/* Token indicator */}
      {isToken && <div className={styles.tokenBadge}>Token</div>}

      {showPreview && (
        <div className={styles.previewOverlay} onClick={handlePreviewClick}>
          <div className={styles.previewCard}>
            <div className={styles.previewName}>{card.name}</div>
            {card.image && (
              <div className={styles.previewImageContainer}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={card.image} alt={card.name} className={styles.previewImage} />
              </div>
            )}
            <div className={styles.previewFlavor}>{card.flavor}</div>
            {card.type === 'creature' && attack !== undefined && health !== undefined ? (
              <div className={styles.previewStats}>
                <div className={styles.previewAttack}>{attack}</div>
                <div className={styles.previewHealth}>{health}</div>
              </div>
            ) : (
              <div className={styles.previewSpellBadge}>Spell</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
