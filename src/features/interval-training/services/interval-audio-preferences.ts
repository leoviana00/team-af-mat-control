
import {
  DEFAULT_INTERVAL_AUDIO_PREFERENCES,
  type IntervalAudioPreferences,
} from '../types/interval-audio-preferences'

const STORAGE_KEY = 'team-af-interval-training-audio-preferences'

const INDIVIDUAL_PREFERENCE_KEYS: Array<
  Exclude<keyof IntervalAudioPreferences, 'enabled'>
> = [
  'preparationCountdown',
  'activityStart',
  'finalCountdown',
  'activityEnd',
  'restStart',
  'restEnd',
  'sessionComplete',
  'sessionCancelled',
]

const PREFERENCE_KEYS: Array<keyof IntervalAudioPreferences> = [
  'enabled',
  ...INDIVIDUAL_PREFERENCE_KEYS,
]

function normalizePreferences(
  value: unknown,
): IntervalAudioPreferences | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const preferences = value as Record<string, unknown>

  const hasValidIndividualPreferences =
    INDIVIDUAL_PREFERENCE_KEYS.every(
      (key) => typeof preferences[key] === 'boolean',
    )

  if (!hasValidIndividualPreferences) {
    return null
  }

  // Migração das preferências antigas, anteriores ao áudio geral.
  const enabled =
    preferences.enabled === undefined
      ? true
      : preferences.enabled

  if (typeof enabled !== 'boolean') {
    return null
  }

  return {
    enabled,
    preparationCountdown: preferences.preparationCountdown as boolean,
    activityStart: preferences.activityStart as boolean,
    finalCountdown: preferences.finalCountdown as boolean,
    activityEnd: preferences.activityEnd as boolean,
    restStart: preferences.restStart as boolean,
    restEnd: preferences.restEnd as boolean,
    sessionComplete: preferences.sessionComplete as boolean,
    sessionCancelled: preferences.sessionCancelled as boolean,
  }
}

function isValidPreferences(
  value: unknown,
): value is IntervalAudioPreferences {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const preferences = value as Record<string, unknown>

  return PREFERENCE_KEYS.every(
    (key) => typeof preferences[key] === 'boolean',
  )
}

export function getIntervalAudioPreferences(): IntervalAudioPreferences {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_INTERVAL_AUDIO_PREFERENCES }
  }

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY)

    if (!storedValue) {
      return { ...DEFAULT_INTERVAL_AUDIO_PREFERENCES }
    }

    const parsed: unknown = JSON.parse(storedValue)
    const normalized = normalizePreferences(parsed)

    if (!normalized) {
      return { ...DEFAULT_INTERVAL_AUDIO_PREFERENCES }
    }

    // Persiste a nova propriedade enabled sem perder
    // as preferências individuais já armazenadas.
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      !('enabled' in parsed)
    ) {
      saveIntervalAudioPreferences(normalized)
    }

    return normalized
  } catch {
    return { ...DEFAULT_INTERVAL_AUDIO_PREFERENCES }
  }
}

export function saveIntervalAudioPreferences(
  preferences: IntervalAudioPreferences,
): boolean {
  if (
    typeof window === 'undefined' ||
    !isValidPreferences(preferences)
  ) {
    return false
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(preferences),
    )

    return true
  } catch {
    return false
  }
}
