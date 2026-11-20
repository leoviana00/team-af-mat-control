
import type {
  CreateIntervalTrainingPreset,
  CustomIntervalTrainingPreset,
  IntervalTrainingPreset,
} from '../types/interval-training-preset'

const STORAGE_KEY = 'team-af-interval-training-presets'

const BUILT_IN_PRESETS: IntervalTrainingPreset[] = [
  {
    id: 'builtin-hiit-basic',
    name: 'HIIT básico',
    description: '30 segundos de atividade e 15 segundos de descanso, por 10 repetições.',
    isBuiltIn: true,
    config: {
      preparationDurationSeconds: 5,
      workout: {
        type: 'repeated',
        activityDurationSeconds: 30,
        restDurationSeconds: 15,
        repetitions: 10,
        restAfterLastActivity: false,
      },
    },
  },
  {
    id: 'builtin-tabata',
    name: 'Tabata',
    description: '20 segundos de atividade e 10 segundos de descanso, por 8 repetições.',
    isBuiltIn: true,
    config: {
      preparationDurationSeconds: 5,
      workout: {
        type: 'repeated',
        activityDurationSeconds: 20,
        restDurationSeconds: 10,
        repetitions: 8,
        restAfterLastActivity: false,
      },
    },
  },
  {
    id: 'builtin-functional-circuit',
    name: 'Circuito funcional',
    description: 'Circuito de exercícios funcionais organizado em 3 voltas.',
    isBuiltIn: true,
    config: {
      preparationDurationSeconds: 5,
      workout: {
        type: 'sequence',
        exercises: [
          {
            id: 'builtin-functional-push-up',
            name: 'Flexão de braço',
            durationSeconds: 30,
            restDurationSeconds: 15,
          },
          {
            id: 'builtin-functional-squat',
            name: 'Agachamento',
            durationSeconds: 30,
            restDurationSeconds: 15,
          },
          {
            id: 'builtin-functional-burpee',
            name: 'Burpee',
            durationSeconds: 30,
            restDurationSeconds: 15,
          },
          {
            id: 'builtin-functional-plank',
            name: 'Prancha',
            durationSeconds: 30,
            restDurationSeconds: 15,
          },
        ],
        loops: 3,
        restAfterLastActivity: false,
      },
    },
  },
  {
    id: 'builtin-jiu-jitsu-conditioning',
    name: 'Condicionamento para Jiu-Jitsu',
    description: 'Sequência de movimentos para condicionamento físico no tatame.',
    isBuiltIn: true,
    config: {
      preparationDurationSeconds: 5,
      workout: {
        type: 'sequence',
        exercises: [
          {
            id: 'builtin-jiu-jitsu-sprawl',
            name: 'Sprawl',
            durationSeconds: 30,
            restDurationSeconds: 15,
          },
          {
            id: 'builtin-jiu-jitsu-technical-standup',
            name: 'Levantada técnica',
            durationSeconds: 30,
            restDurationSeconds: 15,
          },
          {
            id: 'builtin-jiu-jitsu-shrimp',
            name: 'Fuga de quadril',
            durationSeconds: 30,
            restDurationSeconds: 15,
          },
          {
            id: 'builtin-jiu-jitsu-squat',
            name: 'Agachamento',
            durationSeconds: 30,
            restDurationSeconds: 15,
          },
        ],
        loops: 3,
        restAfterLastActivity: false,
      },
    },
  },
]

function cloneConfig(
  config: IntervalTrainingPreset['config'],
): IntervalTrainingPreset['config'] {
  return JSON.parse(JSON.stringify(config)) as IntervalTrainingPreset['config']
}

function clonePreset<T extends IntervalTrainingPreset>(preset: T): T {
  return {
    ...preset,
    config: cloneConfig(preset.config),
  }
}

function isBrowserStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage
  } catch {
    return false
  }
}

function isValidInteger(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= minimum &&
    value <= maximum
  )
}

function isValidExercise(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false
  }

  const exercise = value as Record<string, unknown>

  return (
    typeof exercise.id === 'string' &&
    !!exercise.id.trim() &&
    typeof exercise.name === 'string' &&
    !!exercise.name.trim() &&
    exercise.name.trim().length <= 50 &&
    isValidInteger(exercise.durationSeconds, 1, 3600) &&
    isValidInteger(exercise.restDurationSeconds, 0, 3600)
  )
}

function isValidWorkoutConfig(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false
  }

  const workout = value as Record<string, unknown>

  if (typeof workout.restAfterLastActivity !== 'boolean') {
    return false
  }

  if (workout.type === 'repeated') {
    return (
      isValidInteger(workout.activityDurationSeconds, 1, 3600) &&
      isValidInteger(workout.restDurationSeconds, 0, 3600) &&
      isValidInteger(workout.repetitions, 1, 99)
    )
  }

  if (workout.type === 'sequence') {
    if (
      !Array.isArray(workout.exercises) ||
      workout.exercises.length < 1 ||
      workout.exercises.length > 100 ||
      !isValidInteger(workout.loops, 1, 99)
    ) {
      return false
    }

    const exercises = workout.exercises as unknown[]

    if (!exercises.every(isValidExercise)) {
      return false
    }

    const exerciseIds = exercises.map(
      (exercise) => (exercise as Record<string, unknown>).id,
    )

    return new Set(exerciseIds).size === exerciseIds.length
  }

  return false
}

function isValidPreset(
  value: unknown,
): value is CustomIntervalTrainingPreset {
  if (!value || typeof value !== 'object') {
    return false
  }

  const preset = value as Record<string, unknown>
  const config = preset.config as Record<string, unknown> | undefined

  if (
    typeof preset.id !== 'string' ||
    !preset.id.trim() ||
    typeof preset.name !== 'string' ||
    !preset.name.trim() ||
    preset.name.trim().length > 80 ||
    typeof preset.description !== 'string' ||
    preset.isBuiltIn !== false ||
    !config ||
    typeof config !== 'object'
  ) {
    return false
  }

  return (
    isValidInteger(config.preparationDurationSeconds, 0, 3600) &&
    isValidWorkoutConfig(config.workout)
  )
}

function readCustomPresets(): CustomIntervalTrainingPreset[] {
  if (!isBrowserStorageAvailable()) {
    return []
  }

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY)

    if (!storedValue) {
      return []
    }

    const parsed: unknown = JSON.parse(storedValue)

    if (!Array.isArray(parsed)) {
      return []
    }

    const validPresets = parsed.filter(isValidPreset)
    const uniquePresets = new Map<
      string,
      CustomIntervalTrainingPreset
    >()

    for (const preset of validPresets) {
      const isReservedId = BUILT_IN_PRESETS.some(
        (builtIn) => builtIn.id === preset.id,
      )

      if (!isReservedId) {
        uniquePresets.set(preset.id, clonePreset(preset))
      }
    }

    return Array.from(uniquePresets.values())
  } catch {
    return []
  }
}

function writeCustomPresets(
  presets: CustomIntervalTrainingPreset[],
): boolean {
  if (!isBrowserStorageAvailable()) {
    return false
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(presets),
    )

    return true
  } catch {
    return false
  }
}

function createPresetId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  return `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function getBuiltInPresets(): IntervalTrainingPreset[] {
  return BUILT_IN_PRESETS.map(clonePreset)
}

export function getCustomPresets(): CustomIntervalTrainingPreset[] {
  return readCustomPresets()
}

export function getAllPresets(): IntervalTrainingPreset[] {
  return [
    ...getBuiltInPresets(),
    ...getCustomPresets(),
  ]
}

export function getPresetById(
  id: string,
): IntervalTrainingPreset | undefined {
  const preset = getAllPresets().find(
    (item) => item.id === id,
  )

  return preset ? clonePreset(preset) : undefined
}

export function saveCustomPreset(
  input: CreateIntervalTrainingPreset,
): CustomIntervalTrainingPreset | null {
  const presets = readCustomPresets()
  const id = input.id?.trim() || createPresetId()

  if (BUILT_IN_PRESETS.some((preset) => preset.id === id)) {
    return null
  }

  const preset: CustomIntervalTrainingPreset = {
    ...input,
    id,
    isBuiltIn: false,
    config: cloneConfig(input.config),
  }

  if (!isValidPreset(preset)) {
    return null
  }

  const existingIndex = presets.findIndex(
    (item) => item.id === id,
  )

  if (existingIndex >= 0) {
    presets[existingIndex] = preset
  } else {
    presets.push(preset)
  }

  return writeCustomPresets(presets)
    ? clonePreset(preset)
    : null
}

export function deleteCustomPreset(id: string): boolean {
  if (BUILT_IN_PRESETS.some((preset) => preset.id === id)) {
    return false
  }

  const presets = readCustomPresets()
  const filteredPresets = presets.filter(
    (preset) => preset.id !== id,
  )

  if (filteredPresets.length === presets.length) {
    return false
  }

  return writeCustomPresets(filteredPresets)
}
