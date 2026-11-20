
import type { IntervalTrainingEvent } from '../types/interval-training'
import type { IntervalAudioPreferences } from '../types/interval-audio-preferences'

type AudioTone = {
  frequency: number
  duration: number
  delay: number
}

type AudioPattern = AudioTone[]

type AudioPreferenceKey = Exclude<
  keyof IntervalAudioPreferences,
  'enabled'
>

const AUDIO_PATTERNS: Partial<
  Record<IntervalTrainingEvent['type'], AudioPattern>
> = {
  'activity-start': [
    { frequency: 880, duration: 150, delay: 0 },
    { frequency: 1174, duration: 180, delay: 180 },
  ],

  'activity-end': [
    { frequency: 587, duration: 180, delay: 0 },
  ],

  'rest-start': [
    { frequency: 659, duration: 180, delay: 0 },
  ],

  'rest-end': [
    { frequency: 880, duration: 150, delay: 0 },
    { frequency: 1174, duration: 180, delay: 180 },
  ],

  'session-complete': [
    { frequency: 784, duration: 180, delay: 0 },
    { frequency: 988, duration: 180, delay: 220 },
    { frequency: 1174, duration: 350, delay: 440 },
  ],

  'session-cancelled': [
    { frequency: 587, duration: 200, delay: 0 },
    { frequency: 440, duration: 300, delay: 230 },
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

  try {
    if (!audioContext || audioContext.state === 'closed') {
      const AudioContextConstructor = window.AudioContext

      if (!AudioContextConstructor) {
        return null
      }

      audioContext = new AudioContextConstructor()
    }

    return audioContext
  } catch {
    return null
  }
}

function getPreferenceKey(
  event: IntervalTrainingEvent,
): AudioPreferenceKey | null {
  switch (event.type) {
    case 'preparation-countdown':
      return 'preparationCountdown'

    case 'activity-start':
      return 'activityStart'

    case 'activity-countdown':
    case 'rest-countdown':
      return 'finalCountdown'

    case 'activity-end':
      return 'activityEnd'

    case 'rest-start':
      return 'restStart'

    case 'rest-end':
      return 'restEnd'

    case 'session-complete':
      return 'sessionComplete'

    case 'session-cancelled':
      return 'sessionCancelled'

    case 'activity-warning':
      return null
  }
}

function getAudioPattern(event: IntervalTrainingEvent): AudioPattern {
  switch (event.type) {
    case 'preparation-countdown':
    case 'activity-countdown':
    case 'rest-countdown':
      return COUNTDOWN_PATTERN

    default:
      return AUDIO_PATTERNS[event.type] ?? []
  }
}

/**
 * Deve ser chamada durante uma interação do usuário,
 * como o clique no botão INICIAR TREINO.
 */
export function unlockIntervalAudio(): void {
  const context = getAudioContext()

  if (!context || context.state === 'closed') {
    return
  }

  if (context.state === 'suspended') {
    void context.resume().catch(() => undefined)
  }
}

/**
 * Reproduz o alerta correspondente ao evento do Interval Training.
 * O áudio geral e a preferência individual precisam estar habilitados.
 */
export function playIntervalAudio(
  event: IntervalTrainingEvent,
  preferences: IntervalAudioPreferences,
): void {
  // O controle geral silencia todos os alertas.
  if (!preferences.enabled) {
    return
  }

  const preferenceKey = getPreferenceKey(event)

  if (!preferenceKey || !preferences[preferenceKey]) {
    return
  }

  const pattern = getAudioPattern(event)

  if (pattern.length === 0) {
    return
  }

  const context = getAudioContext()

  if (!context || context.state === 'closed') {
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
export function closeIntervalAudio(): void {
  if (!audioContext || audioContext.state === 'closed') {
    return
  }

  const contextToClose = audioContext
  audioContext = null

  void contextToClose.close()
}
