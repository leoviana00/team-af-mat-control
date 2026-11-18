
export type RoundPhase = 'round' | 'rest' | null

export type RoundStatus =
  | 'idle'
  | 'preparing'
  | 'running'
  | 'paused'
  | 'completed'

export type RoundEvent =
  | { type: 'preparation-countdown'; seconds: number }
  | { type: 'round-start'; round: number }
  | { type: 'round-warning'; round: number }
  | { type: 'round-countdown'; round: number; seconds: number }
  | { type: 'round-end'; round: number }
  | { type: 'rest-start'; round: number }
  | { type: 'rest-warning'; round: number }
  | { type: 'rest-countdown'; round: number; seconds: number }
  | { type: 'rest-end'; round: number }
  | { type: 'session-complete'; round: number }

export interface RoundEngineConfig {
  roundDurationMs: number
  totalRounds: number
  restDurationMs: number
  restAfterLastRound?: boolean
  preparationDurationMs?: number
  tickIntervalMs?: number
  onChange?: (snapshot: RoundSnapshot) => void
  onEvent?: (event: RoundEvent) => void
}

export interface RoundSnapshot {
  status: RoundStatus
  phase: RoundPhase
  currentRound: number
  totalRounds: number
  elapsedMs: number
  remainingMs: number
  preparationRemainingMs: number
}

export interface RoundEngine {
  start: () => void
  pause: () => void
  reset: () => void
  getSnapshot: () => RoundSnapshot
}

const DEFAULT_PREPARATION_DURATION_MS = 5_000
const WARNING_THRESHOLD_MS = 10_000
const FINAL_COUNTDOWN_SECONDS = 5

export function createRoundEngine(config: RoundEngineConfig): RoundEngine {
  const {
    roundDurationMs,
    totalRounds,
    restDurationMs,
    restAfterLastRound = false,
    preparationDurationMs = DEFAULT_PREPARATION_DURATION_MS,
    tickIntervalMs = 100,
    onChange,
    onEvent,
  } = config

  if (!Number.isInteger(totalRounds) || totalRounds < 1) {
    throw new Error('Total rounds must be a positive integer.')
  }

  if (roundDurationMs <= 0 || restDurationMs < 0) {
    throw new Error('Invalid round or rest duration.')
  }

  if (preparationDurationMs < 0) {
    throw new Error('Preparation duration cannot be negative.')
  }

  if (tickIntervalMs <= 0) {
    throw new Error('Tick interval must be greater than zero.')
  }

  let status: RoundStatus = 'idle'
  let phase: RoundPhase = null
  let currentRound = 1

  let phaseDurationMs = roundDurationMs
  let remainingBeforeRun = roundDurationMs

  let preparationElapsedBeforeRun = 0

  let startedAt: number | null = null
  let intervalId: ReturnType<typeof setInterval> | null = null

  let warningEmitted = false
  let lastPreparationSecond = -1
  let lastFinalSecond = -1

  function clearTimer() {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function getPreparationElapsedMs() {
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

  function getPreparationRemainingMs() {
    return Math.max(
      0,
      preparationDurationMs - getPreparationElapsedMs(),
    )
  }

  function getRemainingMs() {
    if (status !== 'running' || startedAt === null) {
      return remainingBeforeRun
    }

    return Math.max(
      0,
      remainingBeforeRun - (Date.now() - startedAt),
    )
  }

  function createSnapshot(): RoundSnapshot {
    const remainingMs = getRemainingMs()

    return {
      status,
      phase,
      currentRound,
      totalRounds,
      elapsedMs:
        status === 'preparing'
          ? 0
          : phaseDurationMs - remainingMs,
      remainingMs,
      preparationRemainingMs: getPreparationRemainingMs(),
    }
  }

  function publish() {
    onChange?.(createSnapshot())
  }

  function emitEvent(event: RoundEvent) {
    onEvent?.(event)
  }

  function emitPreparationCountdown() {
    const remainingMs = getPreparationRemainingMs()
    const seconds = Math.ceil(remainingMs / 1000)

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
    if (remainingMs <= 0) {
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

    if (phase === 'round') {
      emitEvent({
        type: 'round-countdown',
        round: currentRound,
        seconds,
      })
    } else if (phase === 'rest') {
      emitEvent({
        type: 'rest-countdown',
        round: currentRound,
        seconds,
      })
    }
  }

  function emitWarningIfNeeded(remainingMs: number) {
    if (
      warningEmitted ||
      phase === null ||
      phaseDurationMs <= WARNING_THRESHOLD_MS ||
      remainingMs <= 0 ||
      remainingMs > WARNING_THRESHOLD_MS
    ) {
      return
    }

    warningEmitted = true

    if (phase === 'round') {
      emitEvent({
        type: 'round-warning',
        round: currentRound,
      })
    } else {
      emitEvent({
        type: 'rest-warning',
        round: currentRound,
      })
    }
  }

  function complete() {
    clearTimer()

    status = 'completed'
    phase = null
    startedAt = null
    remainingBeforeRun = 0
    phaseDurationMs = 0
    warningEmitted = false
    lastFinalSecond = -1

    emitEvent({
      type: 'session-complete',
      round: currentRound,
    })

    publish()
  }

  function beginPhase(nextPhase: 'round' | 'rest') {
    phase = nextPhase

    phaseDurationMs =
      nextPhase === 'round'
        ? roundDurationMs
        : restDurationMs

    remainingBeforeRun = phaseDurationMs
    startedAt = Date.now()
    status = 'running'

    warningEmitted = false
    lastFinalSecond = -1

    if (nextPhase === 'round') {
      emitEvent({
        type: 'round-start',
        round: currentRound,
      })
    } else {
      emitEvent({
        type: 'rest-start',
        round: currentRound,
      })
    }
  }

  function advance() {
    if (phase === 'round') {
      emitEvent({
        type: 'round-end',
        round: currentRound,
      })

      const isLastRound = currentRound === totalRounds

      if (isLastRound) {
        if (restAfterLastRound && restDurationMs > 0) {
          beginPhase('rest')
        } else {
          complete()
          return
        }
      } else if (restDurationMs > 0) {
        beginPhase('rest')
      } else {
        currentRound += 1
        beginPhase('round')
      }
    } else if (phase === 'rest') {
      emitEvent({
        type: 'rest-end',
        round: currentRound,
      })

      if (currentRound < totalRounds) {
        currentRound += 1
        beginPhase('round')
      } else {
        complete()
        return
      }
    }

    publish()
  }

  function tick() {
    if (status === 'preparing') {
      const preparationElapsed = getPreparationElapsedMs()

      if (preparationElapsed >= preparationDurationMs) {
        preparationElapsedBeforeRun = preparationDurationMs
        beginPhase('round')
        publish()
        return
      }

      emitPreparationCountdown()
      publish()
      return
    }

    if (status !== 'running') {
      return
    }

    const remainingMs = getRemainingMs()

    emitWarningIfNeeded(remainingMs)
    emitFinalCountdown(remainingMs)

    if (remainingMs <= 0) {
      advance()
    } else {
      publish()
    }
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
      currentRound = 1
      phase = null
      preparationElapsedBeforeRun = 0

      lastPreparationSecond = -1
      lastFinalSecond = -1

      warningEmitted = false

      if (preparationDurationMs > 0) {
        status = 'preparing'
        startedAt = Date.now()

        emitPreparationCountdown()
      } else {
        beginPhase('round')
      }
    } else if (status === 'paused') {
      startedAt = Date.now()

      if (phase === null) {
        status = 'preparing'
      } else {
        status = 'running'
      }
    }

    clearTimer()
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
      preparationElapsedBeforeRun = getPreparationElapsedMs()
    } else {
      remainingBeforeRun = getRemainingMs()
    }

    startedAt = null
    status = 'paused'

    clearTimer()
    publish()
  }

  function reset() {
    clearTimer()

    status = 'idle'
    phase = null
    currentRound = 1

    phaseDurationMs = roundDurationMs
    remainingBeforeRun = roundDurationMs

    preparationElapsedBeforeRun = 0

    startedAt = null

    warningEmitted = false
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
