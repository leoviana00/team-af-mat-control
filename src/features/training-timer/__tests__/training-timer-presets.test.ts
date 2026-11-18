
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
} from '../services/training-timer-presets'

const STORAGE_KEY = 'team-af-training-timer-presets'

const customPreset = {
  name: 'Meu treino',
  description: 'Treino personalizado',
  config: {
    type: 'rounds' as const,
    roundDurationSeconds: 240,
    totalRounds: 3,
    restDurationSeconds: 45,
    restAfterLastRound: false,
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
})

describe('Training Timer Presets', () => {
  it('should provide the four built-in presets', () => {
    const presets = getBuiltInPresets()

    expect(presets).toHaveLength(4)
    expect(presets.every((preset) => preset.isBuiltIn)).toBe(true)
  })

  it('should include the standard Jiu-Jitsu configuration', () => {
    const preset = getPresetById('builtin-jiu-jitsu-standard')

    expect(preset?.config).toEqual({
      type: 'rounds',
      roundDurationSeconds: 300,
      totalRounds: 5,
      restDurationSeconds: 60,
      restAfterLastRound: false,
    })
  })

  it('should include the progressive free timer', () => {
    const preset = getPresetById('builtin-free-progressive')

    expect(preset?.config).toEqual({
      type: 'free',
      mode: 'count-up',
      durationSeconds: 0,
    })
  })

  it('should not persist built-in presets in localStorage', () => {
    getAllPresets()

    expect(storage.has(STORAGE_KEY)).toBe(false)
  })

  it('should create a custom preset', () => {
    const saved = saveCustomPreset(customPreset)

    expect(saved).not.toBeNull()
    expect(saved?.name).toBe('Meu treino')
    expect(saved?.isBuiltIn).toBe(false)
    expect(getCustomPresets()).toHaveLength(1)
  })

  it('should persist custom presets in localStorage', () => {
    saveCustomPreset(customPreset)

    const stored = storage.get(STORAGE_KEY)

    expect(stored).toBeDefined()
    expect(JSON.parse(stored!)).toHaveLength(1)
  })

  it('should update an existing custom preset', () => {
    const created = saveCustomPreset(customPreset)

    expect(created).not.toBeNull()

    const updated = saveCustomPreset({
      ...customPreset,
      id: created!.id,
      name: 'Treino atualizado',
    })

    expect(updated?.name).toBe('Treino atualizado')
    expect(getCustomPresets()).toHaveLength(1)
  })

  it('should delete a custom preset', () => {
    const created = saveCustomPreset(customPreset)

    expect(created).not.toBeNull()
    expect(deleteCustomPreset(created!.id)).toBe(true)
    expect(getCustomPresets()).toHaveLength(0)
  })

  it('should not delete a built-in preset', () => {
    expect(deleteCustomPreset('builtin-jiu-jitsu-standard')).toBe(false)
    expect(getPresetById('builtin-jiu-jitsu-standard')).toBeDefined()
  })

  it('should not update a built-in preset', () => {
    const result = saveCustomPreset({
      ...customPreset,
      id: 'builtin-jiu-jitsu-standard',
    })

    expect(result).toBeNull()
  })

  it('should reject invalid configurations', () => {
    const result = saveCustomPreset({
      ...customPreset,
      config: {
        type: 'rounds',
        roundDurationSeconds: -1,
        totalRounds: 0,
        restDurationSeconds: -1,
        restAfterLastRound: false,
      },
    })

    expect(result).toBeNull()
    expect(getCustomPresets()).toHaveLength(0)
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

  it('should not duplicate presets when updating', () => {
    const created = saveCustomPreset(customPreset)

    expect(created).not.toBeNull()

    saveCustomPreset({
      ...customPreset,
      id: created!.id,
      name: 'Updated',
    })

    expect(getCustomPresets()).toHaveLength(1)
  })

  it('should not affect the audio settings storage key', () => {
    storage.set('team-af-training-timer-audio', '{"enabled":true}')

    saveCustomPreset(customPreset)

    expect(storage.get('team-af-training-timer-audio')).toBe(
      '{"enabled":true}',
    )
  })
})
