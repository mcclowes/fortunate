'use client'

// Audio narration queue and playback management for ElevenLabs TTS

type NarrationState = {
  enabled: boolean
  isPlaying: boolean
  queue: string[]
  currentAudio: HTMLAudioElement | null
}

let state: NarrationState = {
  enabled: false,
  isPlaying: false,
  queue: [],
  currentAudio: null,
}

let listeners: Set<() => void> = new Set()

function notifyListeners() {
  listeners.forEach(listener => listener())
}

export function subscribeToNarration(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getNarrationState(): NarrationState {
  return { ...state }
}

export function setNarrationEnabled(enabled: boolean) {
  state = { ...state, enabled }
  notifyListeners()

  // If disabling, stop current playback and clear queue
  if (!enabled) {
    if (state.currentAudio) {
      state.currentAudio.pause()
      state.currentAudio = null
    }
    state = { ...state, queue: [], isPlaying: false }
    notifyListeners()
  }
}

export function toggleNarration(): boolean {
  setNarrationEnabled(!state.enabled)
  return state.enabled
}

async function fetchNarrationAudio(text: string): Promise<string | null> {
  try {
    const response = await fetch('/api/narrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      console.error('Failed to fetch narration:', response.status)
      return null
    }

    const audioBlob = await response.blob()
    return URL.createObjectURL(audioBlob)
  } catch (error) {
    console.error('Narration fetch error:', error)
    return null
  }
}

async function playNext() {
  if (!state.enabled || state.queue.length === 0 || state.isPlaying) {
    return
  }

  const text = state.queue[0]
  state = { ...state, queue: state.queue.slice(1), isPlaying: true }
  notifyListeners()

  const audioUrl = await fetchNarrationAudio(text)

  if (!audioUrl || !state.enabled) {
    state = { ...state, isPlaying: false }
    notifyListeners()
    playNext()
    return
  }

  const audio = new Audio(audioUrl)
  state = { ...state, currentAudio: audio }

  audio.onended = () => {
    URL.revokeObjectURL(audioUrl)
    state = { ...state, isPlaying: false, currentAudio: null }
    notifyListeners()
    playNext()
  }

  audio.onerror = () => {
    console.error('Audio playback error')
    URL.revokeObjectURL(audioUrl)
    state = { ...state, isPlaying: false, currentAudio: null }
    notifyListeners()
    playNext()
  }

  try {
    await audio.play()
  } catch (error) {
    console.error('Audio play error:', error)
    state = { ...state, isPlaying: false, currentAudio: null }
    notifyListeners()
    playNext()
  }
}

export function queueNarration(text: string) {
  if (!state.enabled || !text || text.trim().length === 0) {
    return
  }

  // Clean up the text - remove JSON artifacts if any
  const cleanText = text
    .replace(/^\s*\{[\s\S]*?"narrative"\s*:\s*"?/, '')
    .replace(/"?\s*,?\s*"changes"[\s\S]*$/, '')
    .replace(/^["']|["']$/g, '')
    .trim()

  if (cleanText.length === 0) {
    return
  }

  state = { ...state, queue: [...state.queue, cleanText] }
  notifyListeners()

  // Start playing if not already
  playNext()
}

export function clearNarrationQueue() {
  if (state.currentAudio) {
    state.currentAudio.pause()
  }
  state = { ...state, queue: [], isPlaying: false, currentAudio: null }
  notifyListeners()
}

export function skipCurrentNarration() {
  if (state.currentAudio) {
    state.currentAudio.pause()
    state.currentAudio.onended?.(new Event('ended'))
  }
}
