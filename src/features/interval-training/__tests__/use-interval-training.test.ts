
// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useIntervalTraining } from '../hooks/use-interval-training'

import type {
  IntervalTrainingConfig,
  IntervalTrainingEvent,
} from '../types/interval-training'

function createConfig(
  overrides: Partial<IntervalTrainingConfig> = {},
): IntervalTrainingConfig {
  return {
    preparationDurationSeconds: 0,
    workout: {
      type: 'repeated',
      activityDurationSeconds: 2,
      restDurationSeconds: 1,
      repetitions: 2,
      restAfterLastActivity: false,
    },
    ...overrides,
  }
}

describe('useIntervalTraining', () => {
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('deve inicializar com a configuração e estado corretos', () => {
    const config = createConfig()

    const { result } = renderHook(() =>
      useIntervalTraining(config),
    )

    expect(result.current.config).toEqual(config)
    expect(result.current.snapshot.status).toBe('idle')
    expect(result.current.isConfigLocked).toBe(false)
  })

  it('deve iniciar, pausar e retomar uma sessão', () => {
    vi.useFakeTimers()

    const { result } = renderHook(() =>
      useIntervalTraining(createConfig(), {
        tickIntervalMs: 100,
      }),
    )

    act(() => {
      result.current.start()
    })

    expect(result.current.snapshot.status).toBe('active')
    expect(result.current.isConfigLocked).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    const remainingBeforePause =
      result.current.snapshot.remainingMs

    act(() => {
      result.current.pause()
    })

    expect(result.current.snapshot.status).toBe('paused')

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.snapshot.remainingMs).toBe(
      remainingBeforePause,
    )

    act(() => {
      result.current.resume()
    })

    expect(result.current.snapshot.status).toBe('active')
  })

  it('deve bloquear alterações de configuração durante execução e pausa', () => {
    const { result } = renderHook(() =>
      useIntervalTraining(createConfig()),
    )

    const newConfig = createConfig({
      workout: {
        type: 'repeated',
        activityDurationSeconds: 5,
        restDurationSeconds: 2,
        repetitions: 3,
        restAfterLastActivity: true,
      },
    })

    act(() => {
      result.current.start()
    })

    let updateResult = true

    act(() => {
      updateResult = result.current.updateConfig(newConfig)
    })

    expect(updateResult).toBe(false)
    expect(result.current.config.workout).not.toEqual(
      newConfig.workout,
    )

    act(() => {
      result.current.pause()
    })

    act(() => {
      updateResult = result.current.updateConfig(newConfig)
    })

    expect(updateResult).toBe(false)
    expect(result.current.config.workout).not.toEqual(
      newConfig.workout,
    )
  })

  it('deve permitir atualizar a configuração quando a sessão estiver ociosa', () => {
    const { result } = renderHook(() =>
      useIntervalTraining(createConfig()),
    )

    const newConfig = createConfig({
      workout: {
        type: 'repeated',
        activityDurationSeconds: 5,
        restDurationSeconds: 2,
        repetitions: 3,
        restAfterLastActivity: true,
      },
    })

    let updateResult = false

    act(() => {
      updateResult = result.current.updateConfig(newConfig)
    })

    expect(updateResult).toBe(true)
    expect(result.current.config).toEqual(newConfig)
    expect(result.current.snapshot.status).toBe('idle')
  })

  it('deve permitir atualizar a configuração após o cancelamento', () => {
    const { result } = renderHook(() =>
      useIntervalTraining(createConfig()),
    )

    const newConfig = createConfig({
      workout: {
        type: 'repeated',
        activityDurationSeconds: 8,
        restDurationSeconds: 2,
        repetitions: 4,
        restAfterLastActivity: false,
      },
    })

    act(() => {
      result.current.start()
    })

    act(() => {
      result.current.cancel()
    })

    expect(result.current.snapshot.status).toBe('cancelled')
    expect(result.current.isConfigLocked).toBe(false)

    let updateResult = false

    act(() => {
      updateResult = result.current.updateConfig(newConfig)
    })

    expect(updateResult).toBe(true)
    expect(result.current.config).toEqual(newConfig)
  })

  it('deve concluir a sessão e liberar a configuração', () => {
    vi.useFakeTimers()

    const { result } = renderHook(() =>
      useIntervalTraining(
        createConfig({
          workout: {
            type: 'repeated',
            activityDurationSeconds: 2,
            restDurationSeconds: 1,
            repetitions: 2,
            restAfterLastActivity: false,
          },
        }),
        {
          tickIntervalMs: 100,
        },
      ),
    )

    act(() => {
      result.current.start()
    })

    expect(result.current.snapshot.status).toBe('active')

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(result.current.snapshot.status).toBe('completed')
    expect(result.current.isConfigLocked).toBe(false)
  })

  it('deve encaminhar os eventos emitidos pelo motor', () => {
    vi.useFakeTimers()

    const onEvent = vi.fn<(event: IntervalTrainingEvent) => void>()

    const { result } = renderHook(() =>
      useIntervalTraining(createConfig(), {
        tickIntervalMs: 100,
        onEvent,
      }),
    )

    act(() => {
      result.current.start()
    })

    expect(onEvent).toHaveBeenCalledWith({
      type: 'activity-start',
      name: 'Atividade',
    })
  })
})
