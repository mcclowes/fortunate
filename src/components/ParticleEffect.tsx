'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import styles from '@/styles/Particles.module.scss'

export type ParticleType =
  | 'damage'
  | 'heal'
  | 'attack'
  | 'destroy'
  | 'buff'
  | 'spell'
  | 'summon'
  | 'victory'
  | 'defeat'

type Particle = {
  id: string
  x: number
  y: number
  type: ParticleType
  createdAt: number
}

type ParticleConfig = {
  count: number
  duration: number
  spread: number
  colors: string[]
  shape: 'circle' | 'star' | 'spark' | 'ring'
}

const PARTICLE_CONFIGS: Record<ParticleType, ParticleConfig> = {
  damage: {
    count: 12,
    duration: 600,
    spread: 60,
    colors: ['#e94560', '#ff6b6b', '#ff8888'],
    shape: 'spark',
  },
  heal: {
    count: 10,
    duration: 800,
    spread: 50,
    colors: ['#4ade80', '#86efac', '#bbf7d0'],
    shape: 'circle',
  },
  attack: {
    count: 8,
    duration: 400,
    spread: 40,
    colors: ['#f97316', '#fb923c', '#fbbf24'],
    shape: 'spark',
  },
  destroy: {
    count: 20,
    duration: 700,
    spread: 80,
    colors: ['#e94560', '#ff6b6b', '#fbbf24', '#888'],
    shape: 'spark',
  },
  buff: {
    count: 15,
    duration: 900,
    spread: 45,
    colors: ['#fbbf24', '#fcd34d', '#fef08a'],
    shape: 'star',
  },
  spell: {
    count: 18,
    duration: 800,
    spread: 70,
    colors: ['#4a9eff', '#60a5fa', '#93c5fd', '#a855f7'],
    shape: 'star',
  },
  summon: {
    count: 16,
    duration: 700,
    spread: 55,
    colors: ['#4a9eff', '#fbbf24', '#ffffff'],
    shape: 'ring',
  },
  victory: {
    count: 30,
    duration: 1200,
    spread: 150,
    colors: ['#fbbf24', '#fcd34d', '#4ade80', '#ffffff'],
    shape: 'star',
  },
  defeat: {
    count: 25,
    duration: 1000,
    spread: 100,
    colors: ['#e94560', '#666', '#444', '#222'],
    shape: 'spark',
  },
}

// Context to share particle emitter across components
import { createContext, useContext } from 'react'

type ParticleContextType = {
  emit: (type: ParticleType, x: number, y: number) => void
  emitAtElement: (type: ParticleType, element: HTMLElement | null) => void
}

const ParticleContext = createContext<ParticleContextType | null>(null)

export function useParticles(): ParticleContextType {
  const context = useContext(ParticleContext)
  if (!context) {
    // Return no-op if context isn't available
    return {
      emit: () => {},
      emitAtElement: () => {},
    }
  }
  return context
}

export function ParticleProvider({ children }: { children: React.ReactNode }) {
  const [particles, setParticles] = useState<Particle[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const idCounter = useRef(0)

  // Clean up expired particles
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setParticles(prev =>
        prev.filter(p => now - p.createdAt < PARTICLE_CONFIGS[p.type].duration)
      )
    }, 100)
    return () => clearInterval(interval)
  }, [])

  const emit = useCallback((type: ParticleType, x: number, y: number) => {
    const config = PARTICLE_CONFIGS[type]
    const newParticles: Particle[] = []

    for (let i = 0; i < config.count; i++) {
      newParticles.push({
        id: `particle-${idCounter.current++}`,
        x,
        y,
        type,
        createdAt: Date.now(),
      })
    }

    setParticles(prev => [...prev, ...newParticles])
  }, [])

  const emitAtElement = useCallback((type: ParticleType, element: HTMLElement | null) => {
    if (!element || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const elementRect = element.getBoundingClientRect()

    const x = elementRect.left + elementRect.width / 2 - containerRect.left
    const y = elementRect.top + elementRect.height / 2 - containerRect.top

    emit(type, x, y)
  }, [emit])

  return (
    <ParticleContext.Provider value={{ emit, emitAtElement }}>
      <div ref={containerRef} className={styles.particleContainer}>
        {children}
        <div className={styles.particleLayer}>
          {particles.map(particle => (
            <ParticleGroup key={particle.id} particle={particle} />
          ))}
        </div>
      </div>
    </ParticleContext.Provider>
  )
}

function ParticleGroup({ particle }: { particle: Particle }) {
  const config = PARTICLE_CONFIGS[particle.type]

  return (
    <>
      {Array.from({ length: config.count }).map((_, i) => {
        const angle = (i / config.count) * Math.PI * 2 + Math.random() * 0.5
        const distance = config.spread * (0.5 + Math.random() * 0.5)
        const color = config.colors[Math.floor(Math.random() * config.colors.length)]
        const size = 4 + Math.random() * 6
        const delay = Math.random() * 100

        const endX = Math.cos(angle) * distance
        const endY = Math.sin(angle) * distance - (config.shape === 'circle' ? 20 : 0) // Rise for heal

        return (
          <span
            key={`${particle.id}-${i}`}
            className={`${styles.particle} ${styles[config.shape]}`}
            style={{
              left: particle.x,
              top: particle.y,
              width: size,
              height: size,
              backgroundColor: color,
              boxShadow: `0 0 ${size}px ${color}`,
              '--end-x': `${endX}px`,
              '--end-y': `${endY}px`,
              '--duration': `${config.duration}ms`,
              '--delay': `${delay}ms`,
            } as React.CSSProperties}
          />
        )
      })}
    </>
  )
}

export default ParticleProvider
