
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  deleteCustomPreset,
  getAllPresets,
  getBuiltInPresets,
  getCustomPresets,
  getPresetById,
  saveCustomPreset,
} from '../services/interval-training-presets'

import type { CreateIntervalTrainingPreset } from '../types/interval-training-preset'

const STORAGE_KEY = 'team-af-interval-training-presets'

const repeatedPreset: CreateIntervalTrainingPreset = {
  name: 'Meu HIIT',
  description: 'Treino personalizado',
  config: {
    preparationDurationSeconds: 5,
    workout: {
      type: 'repeated',
      activityDurationSeconds: 40,
      restDurationSeconds: 20,
      repetitions: 5,
      restAfterLastActivity: false,
    },
  },
}

const sequencePreset: CreateIntervalTrainingPreset = {
  name: 'Meu circuito',
  description: 'Circuito personalizado',
  config: {
    preparationDurationSeconds: 10,
    workout: {
      type: 'sequence',
      exercises: [
        {
          id: 'exercise-1',
          name: 'Flexão',
          durationSeconds: 30,
          restDurationSeconds: 15,
        },
        {
          id: 'exercise-2',
          name: 'Agachamento',
          durationSeconds: 40,
          restDurationSeconds: 20,
        },
      ],
      loops: 3,
      restAfterLastActivity: false,
    },
  },
}

let storage: Map<string, string>

beforeEach(() => {
  storage = new Map()

  vi.stubGlobal('window', {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      },
      removeItem: (key: string) => {
        storage.delete(key)
      },
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('Interval Training Presets', () => {
  it('should provide four built-in presets', () => {
    const presets = getBuiltInPresets()

    expect(presets).toHaveLength(4)
    expect(presets.every((preset) => preset.isBuiltIn)).toBe(true)
  })

  it('should provide the HIIT basic configuration', () => {
    const preset = getPresetById('builtin-hiit-basic')

    expect(preset?.config).toEqual({
      preparationDurationSeconds: 5,
      workout: {
        type: 'repeated',
        activityDurationSeconds: 30,
        restDurationSeconds: 15,
        repetitions: 10,
        restAfterLastActivity: false,
      },
    })
  })

  it('should provide the Tabata configuration', () => {
    const preset = getPresetById('builtin-tabata')

    expect(preset?.config.workout).toEqual({
      type: 'repeated',
      activityDurationSeconds: 20,
      restDurationSeconds: 10,
      repetitions: 8,
      restAfterLastActivity: false,
    })
  })

  it('should provide sequence-based built-in presets', () => {
    const presets = getBuiltInPresets()

    const sequences = presets.filter(
      (preset) => preset.config.workout.type === 'sequence',
    )

    expect(sequences).toHaveLength(2)
  })

  it('should not persist built-in presets in localStorage', () => {
    getAllPresets()

    expect(storage.has(STORAGE_KEY)).toBe(false)
  })

  it('should create a custom repeated preset', () => {
    const saved = saveCustomPreset(repeatedPreset)

    expect(saved).not.toBeNull()
    expect(saved?.name).toBe('Meu HIIT')
    expect(saved?.isBuiltIn).toBe(false)
    expect(getCustomPresets()).toHaveLength(1)
  })

  it('should create a custom sequence preset', () => {
    const saved = saveCustomPreset(sequencePreset)

    expect(saved).not.toBeNull()
    expect(saved?.config.workout.type).toBe('sequence')
    expect(getCustomPresets()).toHaveLength(1)
  })

  it('should persist custom presets in localStorage', () => {
    saveCustomPreset(repeatedPreset)

    const stored = storage.get(STORAGE_KEY)

    expect(stored).toBeDefined()
    expect(JSON.parse(stored!)).toHaveLength(1)
  })

  it('should update an existing custom preset', () => {
    const created = saveCustomPreset(repeatedPreset)

    expect(created).not.toBeNull()

    const updated = saveCustomPreset({
      ...repeatedPreset,
      id: created!.id,
      name: 'HIIT atualizado',
    })

    expect(updated?.name).toBe('HIIT atualizado')
    expect(getCustomPresets()).toHaveLength(1)
  })

  it('should delete a custom preset', () => {
    const created = saveCustomPreset(repeatedPreset)

    expect(created).not.toBeNull()
    expect(deleteCustomPreset(created!.id)).toBe(true)
    expect(getCustomPresets()).toHaveLength(0)
  })

  it('should not delete a built-in preset', () => {
    expect(deleteCustomPreset('builtin-hiit-basic')).toBe(false)
    expect(getPresetById('builtin-hiit-basic')).toBeDefined()
  })

  it('should not overwrite a built-in preset', () => {
    const result = saveCustomPreset({
      ...repeatedPreset,
      id: 'builtin-hiit-basic',
    })

    expect(result).toBeNull()
  })

  it('should reject invalid repeated configurations', () => {
    const result = saveCustomPreset({
      ...repeatedPreset,
      config: {
        preparationDurationSeconds: 5,
        workout: {
          type: 'repeated',
          activityDurationSeconds: -1,
          restDurationSeconds: 20,
          repetitions: 5,
          restAfterLastActivity: false,
        },
      },
    })

    expect(result).toBeNull()
    expect(getCustomPresets()).toHaveLength(0)
  })

  it('should reject invalid sequence configurations', () => {
    const result = saveCustomPreset({
      ...sequencePreset,
      config: {
        preparationDurationSeconds: 5,
        workout: {
          type: 'sequence',
          exercises: [],
          loops: 3,
          restAfterLastActivity: false,
        },
      },
    })

    expect(result).toBeNull()
  })

  it('should reject duplicate exercise IDs', () => {
    const result = saveCustomPreset({
      ...sequencePreset,
      config: {
        preparationDurationSeconds: 5,
        workout: {
          type: 'sequence',
          exercises: [
            {
              id: 'duplicate',
              name: 'Flexão',
              durationSeconds: 30,
              restDurationSeconds: 15,
            },
            {
              id: 'duplicate',
              name: 'Agachamento',
              durationSeconds: 30,
              restDurationSeconds: 15,
            },
          ],
          loops: 3,
          restAfterLastActivity: false,
        },
      },
    })

    expect(result).toBeNull()
  })

  it('should reject invalid preparation duration', () => {
    const result = saveCustomPreset({
      ...repeatedPreset,
      config: {
        ...repeatedPreset.config,
        preparationDurationSeconds: -1,
      },
    })

    expect(result).toBeNull()
  })

  it('should ignore corrupted localStorage data', () => {
    storage.set(STORAGE_KEY, '{invalid-json')

    expect(getCustomPresets()).toEqual([])
    expect(getAllPresets()).toHaveLength(4)
  })

  it('should ignore invalid records in localStorage', () => {
    storage.set(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: 'invalid',
          name: '',
          description: 'Invalid preset',
          isBuiltIn: false,
          config: {},
        },
      ]),
    )

    expect(getCustomPresets()).toEqual([])
  })

  it('should not load a custom preset with a built-in ID', () => {
    storage.set(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: 'builtin-hiit-basic',
          name: 'Preset adulterado',
          description: 'Tentativa de sobrescrita',
          isBuiltIn: false,
          config: repeatedPreset.config,
        },
      ]),
    )

    expect(getCustomPresets()).toEqual([])
    expect(getPresetById('builtin-hiit-basic')?.name).toBe('HIIT básico')
  })

  it('should return independent copies of sequence configurations', () => {
    const firstRead = getPresetById('builtin-functional-circuit')

    expect(firstRead?.config.workout.type).toBe('sequence')

    if (firstRead?.config.workout.type !== 'sequence') {
      throw new Error('Expected a sequence preset')
    }

    firstRead.config.workout.exercises[0].name = 'Alterado'

    const secondRead = getPresetById('builtin-functional-circuit')

    expect(secondRead?.config.workout.type).toBe('sequence')

    if (secondRead?.config.workout.type !== 'sequence') {
      throw new Error('Expected a sequence preset')
    }

    expect(secondRead.config.workout.exercises[0].name).toBe(
      'Flexão de braço',
    )
  })

  it('should not affect the Training Timer storage key', () => {
    storage.set(
      'team-af-training-timer-presets',
      '{"existing":true}',
    )

    saveCustomPreset(repeatedPreset)

    expect(
      storage.get('team-af-training-timer-presets'),
    ).toBe('{"existing":true}')
  })
})
