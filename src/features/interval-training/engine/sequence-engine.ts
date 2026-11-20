
import type {
  ExerciseSequenceConfig,
  IntervalTrainingEngine,
  IntervalTrainingEngineOptions,
  IntervalTrainingEvent,
  IntervalTrainingSnapshot,
  SequenceExercise,
} from '../types/interval-training'

type SequencePhase = 'activity' | 'rest'

interface SequenceSegment {
  phase: SequencePhase
  durationMs: number
  exercise: SequenceExercise
  exerciseIndex: number
  loop: number
  activityNumber: number
}

const DEFAULT_PREPARATION_DURATION_MS = 5_000
const DEFAULT_TICK_INTERVAL_MS = 100
const WARNING_THRESHOLD_MS = 10_000
const FINAL_COUNTDOWN_SECONDS = 5

export function createSequenceEngine(
  config: ExerciseSequenceConfig,
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
    sequence: ExerciseSequenceConfig,
    preparation: number,
    tickInterval: number,
  ) {
    if (!Array.isArray(sequence.exercises) || sequence.exercises.length === 0) {
      throw new Error('The sequence must contain at least one exercise.')
    }

    if (!Number.isInteger(sequence.loops) || sequence.loops < 1) {
      throw new Error('The number of loops must be a positive integer.')
    }

    if (!Number.isFinite(preparation) || preparation < 0) {
      throw new Error('Preparation duration must be non-negative and finite.')
    }

    if (!Number.isFinite(tickInterval) || tickInterval <= 0) {
      throw new Error('Tick interval must be positive and finite.')
    }

    sequence.exercises.forEach((exercise, index) => {
      if (!exercise.id.trim()) {
        throw new Error(`Exercise ${index + 1} must have an ID.`)
      }

      if (!exercise.name.trim()) {
        throw new Error(`Exercise ${index + 1} must have a name.`)
      }

      if (
        !Number.isFinite(exercise.durationSeconds) ||
        exercise.durationSeconds <= 0
      ) {
        throw new Error(
          `Exercise "${exercise.name}" must have a positive finite duration.`,
        )
      }

      if (
        !Number.isFinite(exercise.restDurationSeconds) ||
        exercise.restDurationSeconds < 0
      ) {
        throw new Error(
          `Exercise "${exercise.name}" must have a non-negative finite rest duration.`,
        )
      }
    })
  }

  function createSegments(
    sequence: ExerciseSequenceConfig,
  ): SequenceSegment[] {
    const result: SequenceSegment[] = []
    const totalActivities = sequence.exercises.length * sequence.loops

    let activityNumber = 0

    for (let loop = 1; loop <= sequence.loops; loop += 1) {
      sequence.exercises.forEach((exercise, exerciseIndex) => {
        activityNumber += 1

        result.push({
          phase: 'activity',
          durationMs: exercise.durationSeconds * 1000,
          exercise,
          exerciseIndex,
          loop,
          activityNumber,
        })

        const isLastActivity = activityNumber === totalActivities

        const shouldRest =
          exercise.restDurationSeconds > 0 &&
          (!isLastActivity || sequence.restAfterLastActivity)

        if (shouldRest) {
          result.push({
            phase: 'rest',
            durationMs: exercise.restDurationSeconds * 1000,
            exercise,
            exerciseIndex,
            loop,
            activityNumber,
          })
        }
      })
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

    return preparationElapsedBeforeRun + (Date.now() - stageStartedAt)
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

    return workoutElapsedBeforeRun + (Date.now() - stageStartedAt)
  }

  function getCurrentSegmentElapsedMs(workoutElapsed: number): number {
    const segmentStart =
      currentSegmentIndex === 0
        ? 0
        : segmentEndTimes[currentSegmentIndex - 1]

    return Math.max(0, workoutElapsed - segmentStart)
  }

  function getCurrentSegmentRemainingMs(workoutElapsed: number): number {
    const segment = segments[currentSegmentIndex]

    if (!segment) {
      return 0
    }

    return Math.max(
      0,
      segment.durationMs - getCurrentSegmentElapsedMs(workoutElapsed),
    )
  }

  function getNextActivityName(): string | null {
    for (
      let index = currentSegmentIndex + 1;
      index < segments.length;
      index += 1
    ) {
      if (segments[index].phase === 'activity') {
        return segments[index].exercise.name
      }
    }

    return null
  }

  function createSnapshot(): IntervalTrainingSnapshot {
    const workoutElapsed = getWorkoutElapsedMs()
    const segment = segments[currentSegmentIndex]

    const isPreparing = status === 'preparing'
    const isRunning = status === 'active' || status === 'resting'
    const isPaused = status === 'paused'

    const remainingMs = isPreparing
      ? 0
      : segment
        ? getCurrentSegmentRemainingMs(workoutElapsed)
        : 0

    const elapsedMs = segment
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
      currentActivityName: segment?.exercise.name ?? null,
      currentActivityIndex: segment?.exerciseIndex ?? 0,
      totalActivities: config.exercises.length * config.loops,
      currentRepetition: segment?.loop ?? config.loops,
      totalRepetitions: config.loops,
      currentLoop: segment?.loop ?? config.loops,
      totalLoops: config.loops,
      elapsedMs: isRunning || isPaused ? elapsedMs : 0,
      remainingMs,
      preparationRemainingMs:
        isPreparing ||
        (isPaused && phase === 'preparation')
          ? getPreparationRemainingMs()
          : status === 'idle'
            ? preparationDurationMs
            : 0,
      completedActivities,
      progressPercentage:
        status === 'completed' ? 100 : progressPercentage,
      nextActivityName: segment ? getNextActivityName() : null,
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

  function emitSegmentStart(segment: SequenceSegment) {
    phase = segment.phase

    if (segment.phase === 'activity') {
      status = 'active'

      emitEvent({
        type: 'activity-start',
        name: segment.exercise.name,
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

  function emitSegmentEnd(segment: SequenceSegment) {
    if (segment.phase === 'activity') {
      completedActivities += 1

      emitEvent({
        type: 'activity-end',
        name: segment.exercise.name,
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
        name: segment.exercise.name,
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
