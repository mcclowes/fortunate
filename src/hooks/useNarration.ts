'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  subscribeToNarration,
  getNarrationState,
  setNarrationEnabled,
  queueNarration,
  clearNarrationQueue,
  skipCurrentNarration,
} from '@/lib/narration'

export function useNarration() {
  const [state, setState] = useState(getNarrationState)

  useEffect(() => {
    // Subscribe to narration state changes
    const unsubscribe = subscribeToNarration(() => {
      setState(getNarrationState())
    })

    return unsubscribe
  }, [])

  const enable = useCallback(() => setNarrationEnabled(true), [])
  const disable = useCallback(() => setNarrationEnabled(false), [])
  const toggle = useCallback(() => setNarrationEnabled(!state.enabled), [state.enabled])
  const narrate = useCallback((text: string) => queueNarration(text), [])
  const clear = useCallback(() => clearNarrationQueue(), [])
  const skip = useCallback(() => skipCurrentNarration(), [])

  return {
    enabled: state.enabled,
    isPlaying: state.isPlaying,
    queueLength: state.queue.length,
    enable,
    disable,
    toggle,
    narrate,
    clear,
    skip,
  }
}
