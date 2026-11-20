
import type { IntervalTrainingConfig } from './interval-training'

export interface IntervalTrainingPreset {
  id: string
  name: string
  description: string
  isBuiltIn: boolean
  config: IntervalTrainingConfig
}

export type CustomIntervalTrainingPreset = Omit<
  IntervalTrainingPreset,
  'isBuiltIn'
> & {
  isBuiltIn: false
}

export type CreateIntervalTrainingPreset = Omit<
  CustomIntervalTrainingPreset,
  'id' | 'isBuiltIn'
> & {
  id?: string
}
