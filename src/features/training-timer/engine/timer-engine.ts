
export type TimerMode = 'count-up' | 'countdown'

export type TimerStatus =
  | 'idle'
  | 'preparing'
  | 'running'
  | 'paused'
  | 'completed'

export type TimerStage = 'preparation' | 'timer' | null

export type TimerEvent =
  | { type: 'preparation-countdown'; seconds: number }
  | { type: 'timer-start' }
  | { type: 'final-countdown'; seconds: number }
  | { type: 'timer-complete' }

export interface TimerSnapshot {
  mode: TimerMode
  status: TimerStatus
  stage: TimerStage
  elapsedMs: number
  remainingMs: number | null
  durationMs: number | null
  preparationRemainingMs: number
}

interface TimerEngineOptions {
  mode: TimerMode
  durationMs?: number
  preparationDurationMs?: number
  tickIntervalMs?: number
  onChange?: (snapshot: TimerSnapshot) => void
  onEvent?: (event: TimerEvent) => void
}

export interface TimerEngine {
  start: () => void
  pause: () => void
  reset: () => void
  getSnapshot: () => TimerSnapshot
}

const DEFAULT_PREPARATION_DURATION_MS = 5_000
const FINAL_COUNTDOWN_SECONDS = 5

export function createTimerEngine(
  options: TimerEngineOptions,
): TimerEngine {
  const {
    mode,
    durationMs,
    preparationDurationMs = DEFAULT_PREPARATION_DURATION_MS,
    tickIntervalMs = 100,
    onChange,
    onEvent,
  } = options

  if (mode === 'countdown' && (!durationMs || durationMs <= 0)) {
    throw new Error(
      'Countdown requires a duration greater than zero.',
    )
  }

  if (preparationDurationMs < 0) {
    throw new Error(
      'Preparation duration cannot be negative.',
    )
  }

  if (tickIntervalMs <= 0) {
    throw new Error('Tick interval must be greater than zero.')
  }

  let status: TimerStatus = 'idle'
  let stage: TimerStage = null

  let elapsedBeforeRun = 0
  let preparationElapsedBeforeRun = 0

  let startedAt: number | null = null
  let intervalId: ReturnType<typeof setInterval> | null = null

  let lastPreparationSecond = -1
  let lastFinalSecond = -1

  function clearIntervalTimer() {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function calculateElapsed(): number {
    if (
      status !== 'running' ||
      stage !== 'timer' ||
      startedAt === null
    ) {
      return elapsedBeforeRun
    }

    return elapsedBeforeRun + (Date.now() - startedAt)
  }

  function calculatePreparationElapsed(): number {
    if (
      status !== 'preparing' ||
      startedAt === null
    ) {
      return preparationElapsedBeforeRun
    }

    return (
      preparationElapsedBeforeRun +
      (Date.now() - startedAt)
    )
  }

  function createSnapshot(): TimerSnapshot {
    const elapsed = calculateElapsed()

    const boundedElapsed =
      mode === 'countdown'
        ? Math.min(elapsed, durationMs!)
        : elapsed

    const preparationElapsed = calculatePreparationElapsed()

    return {
      mode,
      status,
      stage,
      elapsedMs: boundedElapsed,
      remainingMs:
        mode === 'countdown'
          ? Math.max(0, durationMs! - boundedElapsed)
          : null,
      durationMs: mode === 'countdown' ? durationMs! : null,
      preparationRemainingMs: Math.max(
        0,
        preparationDurationMs - preparationElapsed,
      ),
    }
  }

  function publish() {
    onChange?.(createSnapshot())
  }

  function emitEvent(event: TimerEvent) {
    try {
      onEvent?.(event)
    } catch (error) {
      console.error('Timer event callback failed:', error)
    }
  }

  function complete() {
    clearIntervalTimer()

    elapsedBeforeRun = durationMs!
    startedAt = null
    status = 'completed'
    stage = null

    // Atualiza a interface antes de disparar o áudio.
    publish()

    // Uma falha no áudio não deve impedir a conclusão.
    emitEvent({ type: 'timer-complete' })
  }

  function beginTimer() {
    status = 'running'
    stage = 'timer'

    elapsedBeforeRun = 0
    preparationElapsedBeforeRun = preparationDurationMs
    startedAt = Date.now()

    lastFinalSecond = -1

    emitEvent({ type: 'timer-start' })
    publish()
  }

  function emitPreparationCountdown() {
    const remaining = Math.max(
      0,
      preparationDurationMs - calculatePreparationElapsed(),
    )

    const seconds = Math.ceil(remaining / 1000)

    if (
      seconds <= 0 ||
      seconds === lastPreparationSecond
    ) {
      return
    }

    lastPreparationSecond = seconds

    emitEvent({
      type: 'preparation-countdown',
      seconds,
    })
  }

  function emitFinalCountdown(remainingMs: number) {
    if (mode !== 'countdown' || remainingMs <= 0) {
      return
    }

    const seconds = Math.ceil(remainingMs / 1000)

    if (
      seconds > FINAL_COUNTDOWN_SECONDS ||
      seconds === lastFinalSecond
    ) {
      return
    }

    lastFinalSecond = seconds

    emitEvent({
      type: 'final-countdown',
      seconds,
    })
  }

  function tick() {
    if (status === 'preparing') {
      const preparationElapsed = calculatePreparationElapsed()

      if (preparationElapsed >= preparationDurationMs) {
        beginTimer()
        return
      }

      emitPreparationCountdown()
      publish()
      return
    }

    if (status !== 'running') {
      return
    }

    const elapsed = calculateElapsed()

    if (mode === 'countdown' && elapsed >= durationMs!) {
      complete()
      return
    }

    if (mode === 'countdown') {
      const remaining = Math.max(0, durationMs! - elapsed)
      emitFinalCountdown(remaining)
    }

    publish()
  }

  function start() {
    if (
      status === 'running' ||
      status === 'preparing' ||
      status === 'completed'
    ) {
      return
    }

    if (status === 'idle') {
      elapsedBeforeRun = 0
      preparationElapsedBeforeRun = 0

      lastPreparationSecond = -1
      lastFinalSecond = -1

      if (preparationDurationMs > 0) {
        status = 'preparing'
        stage = 'preparation'
        startedAt = Date.now()

        emitPreparationCountdown()
      } else {
        beginTimer()
      }
    } else if (status === 'paused') {
      status = stage === 'preparation' ? 'preparing' : 'running'
      startedAt = Date.now()
    }

    clearIntervalTimer()
    intervalId = setInterval(tick, tickIntervalMs)

    publish()
  }

  function pause() {
    if (
      status !== 'running' &&
      status !== 'preparing'
    ) {
      return
    }

    if (status === 'preparing') {
      preparationElapsedBeforeRun = calculatePreparationElapsed()
    } else {
      const elapsed = calculateElapsed()

      if (mode === 'countdown' && elapsed >= durationMs!) {
        complete()
        return
      }

      elapsedBeforeRun = elapsed
    }

    startedAt = null
    status = 'paused'

    clearIntervalTimer()
    publish()
  }

  function reset() {
    clearIntervalTimer()

    elapsedBeforeRun = 0
    preparationElapsedBeforeRun = 0

    startedAt = null
    status = 'idle'
    stage = null

    lastPreparationSecond = -1
    lastFinalSecond = -1

    publish()
  }

  return {
    start,
    pause,
    reset,
    getSnapshot: createSnapshot,
  }
}
