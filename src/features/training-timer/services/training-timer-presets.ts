
import type {
  CreateTrainingTimerPreset,
  CustomTrainingTimerPreset,
  TrainingTimerPreset,
} from '../types/training-timer-preset'

const STORAGE_KEY = 'team-af-training-timer-presets'

const BUILT_IN_PRESETS: TrainingTimerPreset[] = [
  {
    id: 'builtin-jiu-jitsu-standard',
    name: 'Jiu-Jitsu padrão',
    description: '5 minutos de round e 1 minuto de descanso, por 5 rounds.',
    isBuiltIn: true,
    config: {
      type: 'rounds',
      roundDurationSeconds: 300,
      totalRounds: 5,
      restDurationSeconds: 60,
      restAfterLastRound: false,
    },
  },
  {
    id: 'builtin-free-progressive',
    name: 'Progressivo livre',
    description: 'Cronômetro livre crescente, sem limite de tempo.',
    isBuiltIn: true,
    config: {
      type: 'free',
      mode: 'count-up',
      durationSeconds: 0,
    },
  },
  {
    id: 'builtin-competition',
    name: 'Competição',
    description: 'Round único de 5 minutos, sem descanso.',
    isBuiltIn: true,
    config: {
      type: 'rounds',
      roundDurationSeconds: 300,
      totalRounds: 1,
      restDurationSeconds: 0,
      restAfterLastRound: false,
    },
  },
  {
    id: 'builtin-technical-training',
    name: 'Treino técnico',
    description: '3 minutos de round e 30 segundos de descanso, por 5 rounds.',
    isBuiltIn: true,
    config: {
      type: 'rounds',
      roundDurationSeconds: 180,
      totalRounds: 5,
      restDurationSeconds: 30,
      restAfterLastRound: false,
    },
  },
]

function isBrowserStorageAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage
}

function isValidPreset(value: unknown): value is CustomTrainingTimerPreset {
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
    typeof preset.description !== 'string' ||
    preset.isBuiltIn !== false ||
    !config ||
    typeof config !== 'object'
  ) {
    return false
  }

  if (config.type === 'free') {
    return (
      (config.mode === 'count-up' || config.mode === 'countdown') &&
      typeof config.durationSeconds === 'number' &&
      Number.isFinite(config.durationSeconds) &&
      config.durationSeconds >= 0 &&
      (config.mode !== 'countdown' || config.durationSeconds > 0)
    )
  }

  if (config.type === 'rounds') {
    return (
      typeof config.roundDurationSeconds === 'number' &&
      Number.isFinite(config.roundDurationSeconds) &&
      config.roundDurationSeconds > 0 &&
      Number.isInteger(config.roundDurationSeconds) &&
      typeof config.totalRounds === 'number' &&
      Number.isInteger(config.totalRounds) &&
      config.totalRounds > 0 &&
      typeof config.restDurationSeconds === 'number' &&
      Number.isFinite(config.restDurationSeconds) &&
      Number.isInteger(config.restDurationSeconds) &&
      config.restDurationSeconds >= 0 &&
      typeof config.restAfterLastRound === 'boolean'
    )
  }

  return false
}

function readCustomPresets(): CustomTrainingTimerPreset[] {
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
    const uniquePresets = new Map<string, CustomTrainingTimerPreset>()

    for (const preset of validPresets) {
      if (!BUILT_IN_PRESETS.some((builtIn) => builtIn.id === preset.id)) {
        uniquePresets.set(preset.id, preset)
      }
    }

    return Array.from(uniquePresets.values())
  } catch {
    return []
  }
}

function writeCustomPresets(
  presets: CustomTrainingTimerPreset[],
): boolean {
  if (!isBrowserStorageAvailable()) {
    return false
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
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

export function getBuiltInPresets(): TrainingTimerPreset[] {
  return BUILT_IN_PRESETS.map((preset) => ({
    ...preset,
    config: { ...preset.config },
  }))
}

export function getCustomPresets(): CustomTrainingTimerPreset[] {
  return readCustomPresets()
}

export function getAllPresets(): TrainingTimerPreset[] {
  return [
    ...getBuiltInPresets(),
    ...getCustomPresets(),
  ]
}

export function getPresetById(
  id: string,
): TrainingTimerPreset | undefined {
  return getAllPresets().find((preset) => preset.id === id)
}

export function saveCustomPreset(
  input: CreateTrainingTimerPreset,
): CustomTrainingTimerPreset | null {
  const presets = readCustomPresets()
  const id = input.id?.trim() || createPresetId()

  if (BUILT_IN_PRESETS.some((preset) => preset.id === id)) {
    return null
  }

  const preset: CustomTrainingTimerPreset = {
    ...input,
    id,
    isBuiltIn: false,
  }

  if (!isValidPreset(preset)) {
    return null
  }

  const existingIndex = presets.findIndex((item) => item.id === id)

  if (existingIndex >= 0) {
    presets[existingIndex] = preset
  } else {
    presets.push(preset)
  }

  return writeCustomPresets(presets) ? preset : null
}

export function deleteCustomPreset(id: string): boolean {
  if (BUILT_IN_PRESETS.some((preset) => preset.id === id)) {
    return false
  }

  const presets = readCustomPresets()
  const filteredPresets = presets.filter((preset) => preset.id !== id)

  if (filteredPresets.length === presets.length) {
    return false
  }

  return writeCustomPresets(filteredPresets)
}
