
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  createIntervalEngine,
} from '../engine/interval-engine'

import type {
  IntervalTrainingEvent,
  RepeatedIntervalConfig,
} from '../types/interval-training'

describe('Interval Engine', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  const baseConfig: RepeatedIntervalConfig = {
    type: 'repeated',
    activityDurationSeconds: 1,
    restDurationSeconds: 500 / 1000,
    repetitions: 2,
    restAfterLastActivity: false,
  }

  it('should alternate between activities and rest periods', () => {
    const engine = createIntervalEngine(baseConfig, {
      preparationDurationMs: 0,
    })

    engine.start()

    expect(engine.getSnapshot()).toMatchObject({
      status: 'active',
      phase: 'activity',
      currentRepetition: 1,
      totalRepetitions: 2,
    })

    vi.advanceTimersByTime(1000)

    expect(engine.getSnapshot()).toMatchObject({
      status: 'resting',
      phase: 'rest',
      currentRepetition: 1,
      remainingMs: 500,
    })

    vi.advanceTimersByTime(500)

    expect(engine.getSnapshot()).toMatchObject({
      status: 'active',
      phase: 'activity',
      currentRepetition: 2,
      remainingMs: 1000,
    })

    vi.advanceTimersByTime(1000)

    expect(engine.getSnapshot()).toMatchObject({
      status: 'completed',
      phase: null,
      completedActivities: 2,
      progressPercentage: 100,
    })
  })

  it('should pause and resume the current activity preserving remaining time', () => {
    const engine = createIntervalEngine(
      {
        ...baseConfig,
        activityDurationSeconds: 5,
      },
      {
        preparationDurationMs: 0,
      },
    )

    engine.start()

    vi.advanceTimersByTime(2000)
    engine.pause()

    expect(engine.getSnapshot()).toMatchObject({
      status: 'paused',
      phase: 'activity',
      remainingMs: 3000,
    })

    vi.advanceTimersByTime(2000)

    engine.resume()

    expect(engine.getSnapshot()).toMatchObject({
      status: 'active',
      phase: 'activity',
      remainingMs: 3000,
    })

    vi.advanceTimersByTime(3000)

    expect(engine.getSnapshot()).toMatchObject({
      status: 'resting',
      phase: 'rest',
    })
  })

  it('should pause and resume preparation preserving remaining time', () => {
    const events: IntervalTrainingEvent[] = []

    const engine = createIntervalEngine(baseConfig, {
      onEvent: (event) => events.push(event),
    })

    engine.start()

    expect(engine.getSnapshot()).toMatchObject({
      status: 'preparing',
      phase: 'preparation',
      preparationRemainingMs: 5000,
    })

    vi.advanceTimersByTime(2000)
    engine.pause()

    expect(engine.getSnapshot()).toMatchObject({
      status: 'paused',
      phase: 'preparation',
      preparationRemainingMs: 3000,
    })

    vi.advanceTimersByTime(3000)
    engine.resume()
    vi.advanceTimersByTime(3000)

    expect(engine.getSnapshot()).toMatchObject({
      status: 'active',
      phase: 'activity',
    })

    const preparationEvents = events.filter(
      (event) => event.type === 'preparation-countdown',
    )

    expect(preparationEvents).toEqual([
      { type: 'preparation-countdown', seconds: 5 },
      { type: 'preparation-countdown', seconds: 4 },
      { type: 'preparation-countdown', seconds: 3 },
      { type: 'preparation-countdown', seconds: 2 },
      { type: 'preparation-countdown', seconds: 1 },
    ])
  })

  it('should execute rest after the last activity when configured', () => {
    const engine = createIntervalEngine(
      {
        ...baseConfig,
        repetitions: 1,
        restAfterLastActivity: true,
      },
      {
        preparationDurationMs: 0,
      },
    )

    engine.start()
    vi.advanceTimersByTime(1000)

    expect(engine.getSnapshot()).toMatchObject({
      status: 'resting',
      phase: 'rest',
      remainingMs: 500,
    })

    vi.advanceTimersByTime(500)

    expect(engine.getSnapshot()).toMatchObject({
      status: 'completed',
      phase: null,
      completedActivities: 1,
    })
  })

  it('should complete without final rest by default', () => {
    const engine = createIntervalEngine(
      {
        ...baseConfig,
        repetitions: 1,
        restAfterLastActivity: false,
      },
      {
        preparationDurationMs: 0,
      },
    )

    engine.start()
    vi.advanceTimersByTime(1000)

    expect(engine.getSnapshot()).toMatchObject({
      status: 'completed',
      phase: null,
    })
  })

  it('should emit events when activities and rest periods change', () => {
    const events: IntervalTrainingEvent[] = []

    const engine = createIntervalEngine(baseConfig, {
      preparationDurationMs: 0,
      onEvent: (event) => events.push(event),
    })

    engine.start()
    vi.advanceTimersByTime(1000)
    vi.advanceTimersByTime(500)
    vi.advanceTimersByTime(1000)

    expect(events.filter(
      (event) =>
        event.type === 'activity-start' ||
        event.type === 'activity-end' ||
        event.type === 'rest-start' ||
        event.type === 'rest-end' ||
        event.type === 'session-complete',
    )).toEqual([
      { type: 'activity-start', name: 'Atividade' },
      { type: 'activity-end', name: 'Atividade' },
      { type: 'rest-start', durationMs: 500 },
      { type: 'rest-end' },
      { type: 'activity-start', name: 'Atividade' },
      { type: 'activity-end', name: 'Atividade' },
      { type: 'session-complete' },
    ])
  })

  it('should cancel the session without completing it', () => {
    const events: IntervalTrainingEvent[] = []

    const engine = createIntervalEngine(baseConfig, {
      preparationDurationMs: 0,
      onEvent: (event) => events.push(event),
    })

    engine.start()
    vi.advanceTimersByTime(500)
    engine.cancel()

    expect(engine.getSnapshot()).toMatchObject({
      status: 'cancelled',
      phase: null,
    })

    expect(events).toContainEqual({
      type: 'session-cancelled',
    })

    expect(events).not.toContainEqual({
      type: 'session-complete',
    })
  })

  it('should reset the session to its initial state', () => {
    const engine = createIntervalEngine(baseConfig, {
      preparationDurationMs: 0,
    })

    engine.start()
    vi.advanceTimersByTime(500)
    engine.reset()

    expect(engine.getSnapshot()).toMatchObject({
      status: 'idle',
      phase: null,
      currentRepetition: 1,
      completedActivities: 0,
      remainingMs: 1000,
      progressPercentage: 0,
    })
  })

  it('should process overdue transitions when timer execution is delayed', () => {
    const events: IntervalTrainingEvent[] = []

    const engine = createIntervalEngine(baseConfig, {
      preparationDurationMs: 0,
      onEvent: (event) => events.push(event),
    })

    engine.start()

    vi.setSystemTime(Date.now() + 2500)
    vi.advanceTimersByTime(100)

    expect(engine.getSnapshot()).toMatchObject({
      status: 'completed',
      phase: null,
      completedActivities: 2,
      progressPercentage: 100,
    })

    expect(events).toContainEqual({
      type: 'session-complete',
    })
  })

  it('should reject invalid activity duration', () => {
    expect(() =>
      createIntervalEngine(
        {
          ...baseConfig,
          activityDurationSeconds: 0,
        },
      ),
    ).toThrow('Activity duration must be a positive finite number.')
  })

  it('should reject invalid repetition count', () => {
    expect(() =>
      createIntervalEngine(
        {
          ...baseConfig,
          repetitions: 0,
        },
      ),
    ).toThrow('Repetitions must be a positive integer.')
  })

  it('should reject invalid rest duration', () => {
    expect(() =>
      createIntervalEngine(
        {
          ...baseConfig,
          restDurationSeconds: -1,
        },
      ),
    ).toThrow('Rest duration must be a non-negative finite number.')
  })
})
