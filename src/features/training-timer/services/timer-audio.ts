
import type { RoundEvent } from '../engine/round-engine'

type AudioTone = {
  frequency: number
  duration: number
  delay: number
}

type AudioPattern = AudioTone[]

const AUDIO_PATTERNS: Partial<
  Record<RoundEvent['type'], AudioPattern>
> = {
  'round-start': [
    { frequency: 880, duration: 180, delay: 0 },
    { frequency: 1174, duration: 220, delay: 200 },
  ],
  'round-warning': [
    { frequency: 880, duration: 120, delay: 0 },
  ],
  'round-end': [
    { frequency: 587, duration: 250, delay: 0 },
  ],
  'rest-start': [
    { frequency: 659, duration: 180, delay: 0 },
  ],
  'rest-warning': [
    { frequency: 784, duration: 120, delay: 0 },
  ],
  'rest-end': [
    { frequency: 880, duration: 180, delay: 0 },
    { frequency: 1174, duration: 220, delay: 200 },
  ],
  'session-complete': [
    { frequency: 784, duration: 180, delay: 0 },
    { frequency: 988, duration: 180, delay: 220 },
    { frequency: 1174, duration: 350, delay: 440 },
  ],
}

const COUNTDOWN_PATTERN: AudioPattern = [
  { frequency: 1046, duration: 100, delay: 0 },
]

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null
  }

  if (!audioContext) {
    const AudioContextConstructor = window.AudioContext

    if (!AudioContextConstructor) {
      return null
    }

    audioContext = new AudioContextConstructor()
  }

  return audioContext
}

function getAudioPattern(event: RoundEvent): AudioPattern {
  switch (event.type) {
    case 'preparation-countdown':
    case 'round-countdown':
    case 'rest-countdown':
      return COUNTDOWN_PATTERN

    default:
      return AUDIO_PATTERNS[event.type] ?? []
  }
}

/**
 * Deve ser chamada durante uma interação do usuário,
 * como o clique no botão INICIAR.
 */
export function unlockTimerAudio(): void {
  const context = getAudioContext()

  if (!context || context.state === 'closed') {
    return
  }

  if (context.state === 'suspended') {
    void context.resume()
  }
}

/**
 * Reproduz o padrão sonoro correspondente ao evento do Round Timer.
 */
export function playTimerAudio(event: RoundEvent): void {
  const context = getAudioContext()

  if (!context || context.state === 'closed') {
    return
  }

  const pattern = getAudioPattern(event)

  if (pattern.length === 0) {
    return
  }

  const play = () => {
    pattern.forEach((tone) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()

      const startAt = context.currentTime + tone.delay / 1000
      const endAt = startAt + tone.duration / 1000

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(tone.frequency, startAt)

      gain.gain.setValueAtTime(0, startAt)
      gain.gain.linearRampToValueAtTime(0.18, startAt + 0.02)
      gain.gain.setValueAtTime(0.18, endAt - 0.03)
      gain.gain.linearRampToValueAtTime(0, endAt)

      oscillator.connect(gain)
      gain.connect(context.destination)

      oscillator.start(startAt)
      oscillator.stop(endAt)
    })
  }

  if (context.state === 'suspended') {
    void context.resume().then(play).catch(() => undefined)
    return
  }

  play()
}

/**
 * Libera os recursos de áudio quando o serviço não for mais utilizado.
 */
export function closeTimerAudio(): void {
  if (!audioContext || audioContext.state === 'closed') {
    return
  }

  void audioContext.close()
  audioContext = null
}
