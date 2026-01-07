// Sound system using Web Audio API for synthesized game sounds
// No external audio files needed - all sounds are generated

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  return audioContext
}

// Ensure audio context is resumed (needed for browser autoplay policies)
export function ensureAudioReady(): void {
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') {
    ctx.resume()
  }
}

type SoundType =
  | 'cardPlay'
  | 'creatureSummon'
  | 'spellCast'
  | 'attack'
  | 'damage'
  | 'heal'
  | 'destroy'
  | 'buff'
  | 'turnStart'
  | 'turnEnd'
  | 'victory'
  | 'defeat'
  | 'draw'

// Create an oscillator-based sound
function createTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3,
  delay: number = 0
): void {
  const ctx = getAudioContext()
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay)

  // Envelope for smoother sound
  gainNode.gain.setValueAtTime(0, ctx.currentTime + delay)
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01)
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration)

  oscillator.start(ctx.currentTime + delay)
  oscillator.stop(ctx.currentTime + delay + duration)
}

// Create noise-based sound (for impacts, explosions)
function createNoise(duration: number, volume: number = 0.2): void {
  const ctx = getAudioContext()
  const bufferSize = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const output = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1
  }

  const noise = ctx.createBufferSource()
  noise.buffer = buffer

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 1000

  const gainNode = ctx.createGain()
  gainNode.gain.setValueAtTime(volume, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  noise.connect(filter)
  filter.connect(gainNode)
  gainNode.connect(ctx.destination)

  noise.start()
  noise.stop(ctx.currentTime + duration)
}

// Sound definitions using synthesized audio
export function playSound(sound: SoundType): void {
  try {
    ensureAudioReady()

    switch (sound) {
      case 'cardPlay':
        // Soft whoosh - rising tone
        createTone(200, 0.15, 'sine', 0.2)
        createTone(400, 0.1, 'sine', 0.15, 0.05)
        break

      case 'creatureSummon':
        // Triumphant chord
        createTone(261.63, 0.3, 'triangle', 0.25) // C4
        createTone(329.63, 0.3, 'triangle', 0.2, 0.05) // E4
        createTone(392.0, 0.3, 'triangle', 0.2, 0.1) // G4
        break

      case 'spellCast':
        // Magical shimmer - descending arpeggio
        createTone(800, 0.15, 'sine', 0.2)
        createTone(600, 0.15, 'sine', 0.18, 0.08)
        createTone(500, 0.2, 'sine', 0.15, 0.16)
        createTone(400, 0.25, 'triangle', 0.12, 0.24)
        break

      case 'attack':
        // Sharp hit with impact
        createTone(150, 0.1, 'sawtooth', 0.3)
        createNoise(0.08, 0.25)
        createTone(80, 0.15, 'square', 0.2, 0.05)
        break

      case 'damage':
        // Thud with crunch
        createTone(100, 0.12, 'sawtooth', 0.35)
        createNoise(0.1, 0.3)
        createTone(60, 0.1, 'square', 0.25, 0.08)
        break

      case 'heal':
        // Gentle rising chime
        createTone(523.25, 0.2, 'sine', 0.2) // C5
        createTone(659.25, 0.25, 'sine', 0.18, 0.1) // E5
        createTone(783.99, 0.3, 'sine', 0.15, 0.2) // G5
        break

      case 'destroy':
        // Explosion/shatter
        createNoise(0.2, 0.35)
        createTone(80, 0.15, 'sawtooth', 0.3)
        createTone(50, 0.2, 'square', 0.25, 0.1)
        createNoise(0.15, 0.2)
        break

      case 'buff':
        // Power-up sparkle
        createTone(440, 0.1, 'sine', 0.2)
        createTone(550, 0.1, 'sine', 0.2, 0.08)
        createTone(660, 0.1, 'sine', 0.2, 0.16)
        createTone(880, 0.15, 'triangle', 0.25, 0.24)
        break

      case 'turnStart':
        // Subtle notification
        createTone(440, 0.08, 'sine', 0.15)
        createTone(550, 0.12, 'sine', 0.12, 0.06)
        break

      case 'turnEnd':
        // Soft close
        createTone(400, 0.1, 'sine', 0.12)
        createTone(300, 0.15, 'sine', 0.1, 0.05)
        break

      case 'victory':
        // Fanfare
        createTone(523.25, 0.2, 'triangle', 0.3) // C5
        createTone(659.25, 0.2, 'triangle', 0.28, 0.15) // E5
        createTone(783.99, 0.2, 'triangle', 0.26, 0.3) // G5
        createTone(1046.5, 0.4, 'triangle', 0.3, 0.45) // C6
        break

      case 'defeat':
        // Sad descending
        createTone(400, 0.25, 'sine', 0.25)
        createTone(350, 0.25, 'sine', 0.22, 0.2)
        createTone(300, 0.25, 'sine', 0.2, 0.4)
        createTone(200, 0.4, 'sine', 0.18, 0.6)
        break

      case 'draw':
        // Card shuffle
        createTone(300, 0.05, 'triangle', 0.15)
        createTone(350, 0.05, 'triangle', 0.12, 0.04)
        break
    }
  } catch (error) {
    // Silently fail if audio isn't available
    console.debug('Audio not available:', error)
  }
}

// Play sound based on state change type
export function playSoundForStateChange(changeType: string): void {
  switch (changeType) {
    case 'damage':
      playSound('damage')
      break
    case 'heal':
      playSound('heal')
      break
    case 'destroy':
      playSound('destroy')
      break
    case 'buff':
      playSound('buff')
      break
    case 'draw':
      playSound('draw')
      break
    case 'summon':
      playSound('creatureSummon')
      break
  }
}
