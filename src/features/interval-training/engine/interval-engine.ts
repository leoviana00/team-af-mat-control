
import type {
  IntervalTrainingEngine,
  IntervalTrainingEngineOptions,
  IntervalTrainingEvent,
  IntervalTrainingSnapshot,
  RepeatedIntervalConfig,
} from '../types/interval-training'

type WorkoutPhase = 'activity' | 'rest'

interface WorkoutSegment {
  phase: WorkoutPhase
  durationMs: number
  repetition: number
}

const DEFAULT_PREPARATION_DURATION_MS = 5_000
const DEFAULT_TICK_INTERVAL_MS = 100
const WARNING_THRESHOLD_MS = 10_000
const FINAL_COUNTDOWN_SECONDS = 5
const ACTIVITY_NAME = 'Atividade'

export function createIntervalEngine(
  config: RepeatedIntervalConfig,
  options: IntervalTrainingEngineOptions = {},
): IntervalTrainingEngine {
  const {
    preparationDurationMs = DEFAULT_PREPARATION_DURATION_MS,
    tickIntervalMs = DEFAULT_TICK_INTERVAL_MS,
    onChange,
    onEvent,
  } = options

  validateConfig(config, preparationDurationMs, tickIntervalMs)

  const segments = createSegments(config)

  const totalDurationMs = segments.reduce(
    (total, segment) => total + segment.durationMs,
    0,
  )

  const segmentEndTimes: number[] = []
  let accumulatedDuration = 0

  for (const segment of segments) {
    accumulatedDuration += segment.durationMs
    segmentEndTimes.push(accumulatedDuration)
  }

  let status: IntervalTrainingSnapshot['status'] = 'idle'
  let phase: IntervalTrainingSnapshot['phase'] = null

  let currentSegmentIndex = 0
  let completedActivities = 0

  let preparationElapsedBeforeRun = 0
  let workoutElapsedBeforeRun = 0

  let stageStartedAt: number | null = null
  let intervalId: ReturnType<typeof setInterval> | null = null

  let lastPreparationSecond = -1
  let lastCountdownSecond = -1
  let warningEmitted = false

  function validateConfig(
    workout: RepeatedIntervalConfig,
    preparation: number,
    tickInterval: number,
  ) {
    if (
      !Number.isFinite(workout.activityDurationSeconds) ||
      workout.activityDurationSeconds <= 0
    ) {
      throw new Error('Activity duration must be a positive finite number.')
    }

    if (
      !Number.isFinite(workout.restDurationSeconds) ||
      workout.restDurationSeconds < 0
    ) {
      throw new Error('Rest duration must be a non-negative finite number.')
    }

    if (
      !Number.isInteger(workout.repetitions) ||
      workout.repetitions < 1
    ) {
      throw new Error('Repetitions must be a positive integer.')
    }

    if (!Number.isFinite(preparation) || preparation < 0) {
      throw new Error('Preparation duration must be non-negative and finite.')
    }

    if (!Number.isFinite(tickInterval) || tickInterval <= 0) {
      throw new Error('Tick interval must be positive and finite.')
    }
  }

  function createSegments(
    workout: RepeatedIntervalConfig,
  ): WorkoutSegment[] {
    const result: WorkoutSegment[] = []

    for (
      let repetition = 1;
      repetition <= workout.repetitions;
      repetition += 1
    ) {
      result.push({
        phase: 'activity',
        durationMs: workout.activityDurationSeconds * 1000,
        repetition,
      })

      const isLastRepetition = repetition === workout.repetitions

      const shouldRest =
        workout.restDurationSeconds > 0 &&
        (!isLastRepetition || workout.restAfterLastActivity)

      if (shouldRest) {
        result.push({
          phase: 'rest',
          durationMs: workout.restDurationSeconds * 1000,
          repetition,
        })
      }
    }

    return result
  }

  function clearTimer() {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function emitEvent(event: IntervalTrainingEvent) {
    onEvent?.(event)
  }

  function getPreparationElapsedMs(): number {
    if (status !== 'preparing' || stageStartedAt === null) {
      return preparationElapsedBeforeRun
    }

    return (
      preparationElapsedBeforeRun +
      (Date.now() - stageStartedAt)
    )
  }

  function getPreparationRemainingMs(): number {
    return Math.max(
      0,
      preparationDurationMs - getPreparationElapsedMs(),
    )
  }

  function getWorkoutElapsedMs(): number {
    if (
      (status !== 'active' && status !== 'resting') ||
      stageStartedAt === null
    ) {
      return workoutElapsedBeforeRun
    }

    return (
      workoutElapsedBeforeRun +
      (Date.now() - stageStartedAt)
    )
  }

  function getCurrentSegmentElapsedMs(
    workoutElapsed: number,
  ): number {
    const segmentStart =
      currentSegmentIndex === 0
        ? 0
        : segmentEndTimes[currentSegmentIndex - 1]

    return Math.max(0, workoutElapsed - segmentStart)
  }

  function getCurrentSegmentRemainingMs(
    workoutElapsed: number,
  ): number {
    const segment = segments[currentSegmentIndex]

    if (!segment) {
      return 0
    }

    return Math.max(
      0,
      segment.durationMs - getCurrentSegmentElapsedMs(workoutElapsed),
    )
  }

  function createSnapshot(): IntervalTrainingSnapshot {
    const workoutElapsed = getWorkoutElapsedMs()
    const segment = segments[currentSegmentIndex]

    const isPreparing = status === 'preparing'
    const isRunning = status === 'active' || status === 'resting'

    const currentActivityIndex = segment
      ? segment.repetition - 1
      : config.repetitions - 1

    const remainingMs = isPreparing
      ? 0
      : segment
        ? getCurrentSegmentRemainingMs(workoutElapsed)
        : 0

    const elapsedMs = isPreparing
      ? 0
      : segment
        ? getCurrentSegmentElapsedMs(workoutElapsed)
        : 0

    const progressPercentage =
      totalDurationMs > 0
        ? Math.min(
            100,
            Math.max(0, (workoutElapsed / totalDurationMs) * 100),
          )
        : 0

    return {
      status,
      phase,
      currentActivityName: segment ? ACTIVITY_NAME : null,
      currentActivityIndex,
      totalActivities: config.repetitions,
      currentRepetition: segment?.repetition ?? config.repetitions,
      totalRepetitions: config.repetitions,
      currentLoop: 1,
      totalLoops: 1,
      elapsedMs: isRunning || status === 'paused' ? elapsedMs : 0,
      remainingMs,
      preparationRemainingMs:
        isPreparing ||
        (status === 'paused' && phase === 'preparation')
          ? getPreparationRemainingMs()
          : status === 'idle'
            ? preparationDurationMs
            : 0,
      completedActivities,
      progressPercentage:
        status === 'completed' ? 100 : progressPercentage,
      nextActivityName:
        segment && segment.repetition < config.repetitions
          ? ACTIVITY_NAME
          : null,
    }
  }

  function publish() {
    onChange?.(createSnapshot())
  }

  function emitPreparationCountdown() {
    const seconds = Math.ceil(getPreparationRemainingMs() / 1000)

    if (seconds <= 0 || seconds === lastPreparationSecond) {
      return
    }

    lastPreparationSecond = seconds

    emitEvent({
      type: 'preparation-countdown',
      seconds,
    })
  }

  function emitSegmentStart(segment: WorkoutSegment) {
    phase = segment.phase

    if (segment.phase === 'activity') {
      status = 'active'

      emitEvent({
        type: 'activity-start',
        name: ACTIVITY_NAME,
      })
    } else {
      status = 'resting'

      emitEvent({
        type: 'rest-start',
        durationMs: segment.durationMs,
      })
    }

    lastCountdownSecond = -1
    warningEmitted = false
  }

  function emitSegmentEnd(segment: WorkoutSegment) {
    if (segment.phase === 'activity') {
      completedActivities += 1

      emitEvent({
        type: 'activity-end',
        name: ACTIVITY_NAME,
      })
    } else {
      emitEvent({
        type: 'rest-end',
      })
    }
  }

  function complete() {
    clearTimer()

    status = 'completed'
    phase = null
    stageStartedAt = null
    workoutElapsedBeforeRun = totalDurationMs
    currentSegmentIndex = segments.length

    emitEvent({
      type: 'session-complete',
    })

    publish()
  }

  function processTransitions(workoutElapsed: number): boolean {
    while (
      currentSegmentIndex < segments.length &&
      workoutElapsed >= segmentEndTimes[currentSegmentIndex]
    ) {
      const finishedSegment = segments[currentSegmentIndex]

      emitSegmentEnd(finishedSegment)
      currentSegmentIndex += 1

      if (currentSegmentIndex >= segments.length) {
        complete()
        return true
      }

      emitSegmentStart(segments[currentSegmentIndex])
    }

    return false
  }

  function emitCurrentCountdown(workoutElapsed: number) {
    const segment = segments[currentSegmentIndex]

    if (!segment) {
      return
    }

    const remainingMs = getCurrentSegmentRemainingMs(workoutElapsed)

    if (remainingMs <= 0) {
      return
    }

    if (
      segment.phase === 'activity' &&
      segment.durationMs > WARNING_THRESHOLD_MS &&
      remainingMs <= WARNING_THRESHOLD_MS &&
      !warningEmitted
    ) {
      warningEmitted = true

      emitEvent({
        type: 'activity-warning',
        name: ACTIVITY_NAME,
      })
    }

    const seconds = Math.ceil(remainingMs / 1000)

    if (
      seconds <= 0 ||
      seconds > FINAL_COUNTDOWN_SECONDS ||
      seconds === lastCountdownSecond
    ) {
      return
    }

    lastCountdownSecond = seconds

    if (segment.phase === 'activity') {
      emitEvent({
        type: 'activity-countdown',
        seconds,
      })
    } else {
      emitEvent({
        type: 'rest-countdown',
        seconds,
      })
    }
  }

  function beginWorkout(startedAt = Date.now()) {
    preparationElapsedBeforeRun = preparationDurationMs
    workoutElapsedBeforeRun = 0
    currentSegmentIndex = 0
    completedActivities = 0

    stageStartedAt = startedAt

    emitSegmentStart(segments[0])
    processTransitions(0)
    emitCurrentCountdown(0)
  }

  function tick() {
    if (status === 'preparing') {
      const preparationElapsed = getPreparationElapsedMs()

      if (preparationElapsed >= preparationDurationMs) {
        const preparationEndTime =
          (stageStartedAt ?? Date.now()) +
          (preparationDurationMs - preparationElapsedBeforeRun)

        beginWorkout(preparationEndTime)
        tick()
        return
      }

      emitPreparationCountdown()
      publish()
      return
    }

    if (status !== 'active' && status !== 'resting') {
      return
    }

    const workoutElapsed = getWorkoutElapsedMs()

    const sessionCompleted = processTransitions(workoutElapsed)

    if (sessionCompleted) {
      return
    }

    emitCurrentCountdown(workoutElapsed)
    publish()
  }

  function start() {
    if (status !== 'idle') {
      return
    }

    lastPreparationSecond = -1
    lastCountdownSecond = -1
    warningEmitted = false

    if (preparationDurationMs > 0) {
      status = 'preparing'
      phase = 'preparation'
      stageStartedAt = Date.now()

      emitPreparationCountdown()
    } else {
      beginWorkout()
    }

    clearTimer()
    intervalId = setInterval(tick, tickIntervalMs)

    publish()
  }

  function pause() {
    if (
      status !== 'preparing' &&
      status !== 'active' &&
      status !== 'resting'
    ) {
      return
    }

    if (status === 'preparing') {
      preparationElapsedBeforeRun = getPreparationElapsedMs()
    } else {
      workoutElapsedBeforeRun = getWorkoutElapsedMs()
    }

    stageStartedAt = null
    status = 'paused'

    clearTimer()
    publish()
  }

  function resume() {
    if (status !== 'paused') {
      return
    }

    stageStartedAt = Date.now()

    if (phase === 'preparation') {
      status = 'preparing'
    } else if (phase === 'activity') {
      status = 'active'
    } else if (phase === 'rest') {
      status = 'resting'
    } else {
      return
    }

    clearTimer()
    intervalId = setInterval(tick, tickIntervalMs)

    publish()
  }

  function reset() {
    clearTimer()

    status = 'idle'
    phase = null

    currentSegmentIndex = 0
    completedActivities = 0

    preparationElapsedBeforeRun = 0
    workoutElapsedBeforeRun = 0

    stageStartedAt = null

    lastPreparationSecond = -1
    lastCountdownSecond = -1
    warningEmitted = false

    publish()
  }

  function cancel() {
    if (
      status === 'idle' ||
      status === 'completed' ||
      status === 'cancelled'
    ) {
      return
    }

    clearTimer()

    status = 'cancelled'
    phase = null
    stageStartedAt = null

    emitEvent({
      type: 'session-cancelled',
    })

    publish()
  }

  return {
    start,
    pause,
    resume,
    reset,
    cancel,
    getSnapshot: createSnapshot,
  }
}
