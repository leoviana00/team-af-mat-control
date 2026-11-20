
export type IntervalTrainingStatus =
  | 'idle'
  | 'preparing'
  | 'active'
  | 'resting'
  | 'paused'
  | 'completed'
  | 'cancelled'

export type IntervalTrainingPhase =
  | 'preparation'
  | 'activity'
  | 'rest'
  | null

export type IntervalTrainingMode = 'repeated' | 'sequence'

export interface RepeatedIntervalConfig {
  type: 'repeated'
  activityDurationSeconds: number
  restDurationSeconds: number
  repetitions: number
  restAfterLastActivity: boolean
}

export interface SequenceExercise {
  id: string
  name: string
  durationSeconds: number
  restDurationSeconds: number
}

export interface ExerciseSequenceConfig {
  type: 'sequence'
  exercises: SequenceExercise[]
  loops: number
  restAfterLastActivity: boolean
}

export type IntervalWorkoutConfig =
  | RepeatedIntervalConfig
  | ExerciseSequenceConfig

export interface IntervalTrainingConfig {
  preparationDurationSeconds: number
  workout: IntervalWorkoutConfig
}

export interface IntervalTrainingSnapshot {
  status: IntervalTrainingStatus
  phase: IntervalTrainingPhase

  currentActivityName: string | null
  currentActivityIndex: number
  totalActivities: number

  currentRepetition: number
  totalRepetitions: number

  currentLoop: number
  totalLoops: number

  elapsedMs: number
  remainingMs: number
  preparationRemainingMs: number

  completedActivities: number
  progressPercentage: number

  nextActivityName: string | null
}

export type IntervalTrainingEvent =
  | { type: 'preparation-countdown'; seconds: number }
  | { type: 'activity-start'; name: string }
  | { type: 'activity-warning'; name: string }
  | { type: 'activity-countdown'; seconds: number }
  | { type: 'activity-end'; name: string }
  | { type: 'rest-start'; durationMs: number }
  | { type: 'rest-countdown'; seconds: number }
  | { type: 'rest-end' }
  | { type: 'session-complete' }
  | { type: 'session-cancelled' }

export interface IntervalTrainingEngine {
  start: () => void
  pause: () => void
  resume: () => void
  reset: () => void
  cancel: () => void
  getSnapshot: () => IntervalTrainingSnapshot
}

export interface IntervalTrainingEngineOptions {
  preparationDurationMs?: number
  tickIntervalMs?: number
  onChange?: (snapshot: IntervalTrainingSnapshot) => void
  onEvent?: (event: IntervalTrainingEvent) => void
}
