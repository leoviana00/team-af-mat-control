export interface IntervalAudioPreferences {
  enabled: boolean
  preparationCountdown: boolean
  activityStart: boolean
  finalCountdown: boolean
  activityEnd: boolean
  restStart: boolean
  restEnd: boolean
  sessionComplete: boolean
  sessionCancelled: boolean
}

export const DEFAULT_INTERVAL_AUDIO_PREFERENCES: IntervalAudioPreferences = {
  enabled: true,
  preparationCountdown: true,
  activityStart: true,
  finalCountdown: true,
  activityEnd: true,
  restStart: true,
  restEnd: true,
  sessionComplete: true,
  sessionCancelled: true,
}