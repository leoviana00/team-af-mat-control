
export type TimerPresetType = 'free' | 'rounds'

export type FreeTimerMode = 'count-up' | 'countdown'

export interface FreeTimerPresetConfig {
  type: 'free'
  mode: FreeTimerMode
  durationSeconds: number
}

export interface RoundTimerPresetConfig {
  type: 'rounds'
  roundDurationSeconds: number
  totalRounds: number
  restDurationSeconds: number
  restAfterLastRound: boolean
}

export type TimerPresetConfig =
  | FreeTimerPresetConfig
  | RoundTimerPresetConfig

export interface TrainingTimerPreset {
  id: string
  name: string
  description: string
  isBuiltIn: boolean
  config: TimerPresetConfig
}

export type CustomTrainingTimerPreset = Omit<
  TrainingTimerPreset,
  'isBuiltIn'
> & {
  isBuiltIn: false
}

export type CreateTrainingTimerPreset = Omit<
  CustomTrainingTimerPreset,
  'id' | 'isBuiltIn'
> & {
  id?: string
}
