
import { useEffect, useMemo, useState } from 'react'
import {
  createTimerEngine,
  type TimerEvent,
  type TimerMode,
  type TimerSnapshot,
} from '../engine/timer-engine'

const DEFAULT_PREPARATION_DURATION_MS = 5_000
const SAFE_ENGINE_DURATION_MS = 1

interface UseTrainingTimerOptions {
  mode: TimerMode
  durationMs?: number
  preparationDurationMs?: number
  onEvent?: (event: TimerEvent) => void
}

export function useTrainingTimer({
  mode,
  durationMs,
  preparationDurationMs = DEFAULT_PREPARATION_DURATION_MS,
  onEvent,
}: UseTrainingTimerOptions) {
  const invalidCountdown =
    mode === 'countdown' &&
    (!durationMs || durationMs <= 0)

  const engineDurationMs = invalidCountdown
    ? SAFE_ENGINE_DURATION_MS
    : durationMs

  const [snapshot, setSnapshot] = useState<TimerSnapshot>({
    mode,
    status: 'idle',
    stage: null,
    elapsedMs: 0,
    remainingMs: mode === 'countdown' ? durationMs ?? 0 : null,
    durationMs: mode === 'countdown' ? durationMs ?? 0 : null,
    preparationRemainingMs: preparationDurationMs,
  })

  const engine = useMemo(
    () =>
      createTimerEngine({
        mode,
        durationMs: engineDurationMs,
        preparationDurationMs,
        onChange: setSnapshot,
        onEvent,
      }),
    [
      mode,
      engineDurationMs,
      preparationDurationMs,
      onEvent,
    ],
  )

  useEffect(() => {
    return () => {
      engine.pause()
    }
  }, [engine])

  const expectedDuration =
    mode === 'countdown' ? durationMs ?? 0 : null

  const configurationChanged =
    snapshot.mode !== mode ||
    snapshot.durationMs !== expectedDuration ||
    snapshot.preparationRemainingMs > preparationDurationMs

  const invalidSnapshot: TimerSnapshot = {
    mode,
    status: 'idle',
    stage: null,
    elapsedMs: 0,
    remainingMs: 0,
    durationMs: 0,
    preparationRemainingMs: preparationDurationMs,
  }

  return {
    snapshot: invalidCountdown
      ? invalidSnapshot
      : configurationChanged
        ? engine.getSnapshot()
        : snapshot,

    start: () => {
      if (!invalidCountdown) {
        engine.start()
      }
    },

    pause: engine.pause,
    reset: engine.reset,
  }
}
