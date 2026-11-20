
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSequenceEngine } from '../engine/sequence-engine'
import type {
  ExerciseSequenceConfig,
  IntervalTrainingEvent,
} from '../types/interval-training'

const createConfig = (
  overrides: Partial<ExerciseSequenceConfig> = {},
): ExerciseSequenceConfig => ({
  type: 'sequence',
  exercises: [
    {
      id: '1',
      name: 'Flexão',
      durationSeconds: 10,
      restDurationSeconds: 5,
    },
    {
      id: '2',
      name: 'Agachamento',
      durationSeconds: 8,
      restDurationSeconds: 3,
    },
  ],
  loops: 2,
  restAfterLastActivity: false,
  ...overrides,
})

describe('Sequence Engine', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T10:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should execute exercises in the configured order', () => {
    const events: IntervalTrainingEvent[] = []

    const engine = createSequenceEngine(createConfig(), {
      preparationDurationMs: 0,
      onEvent: (event) => events.push(event),
    })

    engine.start()

    expect(events).toContainEqual({
      type: 'activity-start',
      name: 'Flexão',
    })

    vi.advanceTimersByTime(10_000)

    expect(events).toContainEqual({
      type: 'rest-start',
      durationMs: 5_000,
    })

    vi.advanceTimersByTime(5_000)

    expect(events).toContainEqual({
      type: 'activity-start',
      name: 'Agachamento',
    })

    vi.advanceTimersByTime(11_000)

    expect(events).toContainEqual({
      type: 'activity-start',
      name: 'Flexão',
    })
  })

  it('should respect individual rest durations', () => {
    const events: IntervalTrainingEvent[] = []

    const engine = createSequenceEngine(createConfig(), {
      preparationDurationMs: 0,
      onEvent: (event) => events.push(event),
    })

    engine.start()
    vi.advanceTimersByTime(10_000)

    expect(events).toContainEqual({
      type: 'rest-start',
      durationMs: 5_000,
    })

    vi.advanceTimersByTime(5_000)

    expect(events).toContainEqual({
      type: 'activity-start',
      name: 'Agachamento',
    })

    vi.advanceTimersByTime(8_000)

    expect(events).toContainEqual({
      type: 'rest-start',
      durationMs: 3_000,
    })
  })

  it('should repeat the configured number of loops', () => {
    const events: IntervalTrainingEvent[] = []

    const engine = createSequenceEngine(createConfig(), {
      preparationDurationMs: 0,
      onEvent: (event) => events.push(event),
    })

    engine.start()

    vi.advanceTimersByTime(49_000)

    const activityStarts = events.filter(
      (event) => event.type === 'activity-start',
    )

    expect(activityStarts).toHaveLength(4)

    expect(
      activityStarts.map((event) =>
        event.type === 'activity-start' ? event.name : '',
      ),
    ).toEqual([
      'Flexão',
      'Agachamento',
      'Flexão',
      'Agachamento',
    ])
  })

  it('should complete without final rest by default', () => {
    const events: IntervalTrainingEvent[] = []

    const engine = createSequenceEngine(createConfig(), {
      preparationDurationMs: 0,
      onEvent: (event) => events.push(event),
    })

    engine.start()
    vi.advanceTimersByTime(49_000)

    expect(engine.getSnapshot().status).toBe('completed')

    expect(events).toContainEqual({
      type: 'session-complete',
    })

    expect(
      events.filter((event) => event.type === 'rest-start'),
    ).toHaveLength(3)
  })

  it('should execute final rest when configured', () => {
    const events: IntervalTrainingEvent[] = []

    const engine = createSequenceEngine(
      createConfig({
        restAfterLastActivity: true,
      }),
      {
        preparationDurationMs: 0,
        onEvent: (event) => events.push(event),
      },
    )

    engine.start()
    vi.advanceTimersByTime(49_000)

    expect(engine.getSnapshot().status).toBe('resting')
    expect(engine.getSnapshot().remainingMs).toBe(3_000)

    vi.advanceTimersByTime(3_000)

    expect(engine.getSnapshot().status).toBe('completed')

    expect(
      events.filter((event) => event.type === 'rest-start'),
    ).toHaveLength(4)
  })

  it('should pause and resume while preserving activity time', () => {
    const engine = createSequenceEngine(createConfig(), {
      preparationDurationMs: 0,
    })

    engine.start()
    vi.advanceTimersByTime(4_000)

    engine.pause()

    expect(engine.getSnapshot().status).toBe('paused')
    expect(engine.getSnapshot().remainingMs).toBe(6_000)

    vi.advanceTimersByTime(10_000)

    expect(engine.getSnapshot().remainingMs).toBe(6_000)

    engine.resume()
    vi.advanceTimersByTime(6_000)

    expect(engine.getSnapshot().phase).toBe('rest')
    expect(engine.getSnapshot().remainingMs).toBe(5_000)
  })

  it('should pause and resume preparation preserving remaining time', () => {
    const engine = createSequenceEngine(createConfig(), {
      preparationDurationMs: 5_000,
    })

    engine.start()
    vi.advanceTimersByTime(2_000)

    engine.pause()

    expect(engine.getSnapshot().preparationRemainingMs).toBe(3_000)

    vi.advanceTimersByTime(10_000)

    expect(engine.getSnapshot().preparationRemainingMs).toBe(3_000)

    engine.resume()
    vi.advanceTimersByTime(3_000)

    expect(engine.getSnapshot().status).toBe('active')
    expect(engine.getSnapshot().remainingMs).toBe(10_000)
  })

  it('should emit activity and rest events', () => {
    const events: IntervalTrainingEvent[] = []

    const engine = createSequenceEngine(createConfig(), {
      preparationDurationMs: 0,
      onEvent: (event) => events.push(event),
    })

    engine.start()
    vi.advanceTimersByTime(49_000)

    expect(events).toContainEqual({
      type: 'activity-end',
      name: 'Flexão',
    })

    expect(events).toContainEqual({
      type: 'rest-end',
    })
  })

  it('should cancel without completing the session', () => {
    const events: IntervalTrainingEvent[] = []

    const engine = createSequenceEngine(createConfig(), {
      preparationDurationMs: 0,
      onEvent: (event) => events.push(event),
    })

    engine.start()
    vi.advanceTimersByTime(2_000)

    engine.cancel()

    expect(engine.getSnapshot().status).toBe('cancelled')

    expect(events).toContainEqual({
      type: 'session-cancelled',
    })

    expect(events).not.toContainEqual({
      type: 'session-complete',
    })
  })

  it('should reset the session to its initial state', () => {
    const engine = createSequenceEngine(createConfig(), {
      preparationDurationMs: 0,
    })

    engine.start()
    vi.advanceTimersByTime(10_000)

    engine.reset()

    expect(engine.getSnapshot().status).toBe('idle')
    expect(engine.getSnapshot().phase).toBeNull()
    expect(engine.getSnapshot().currentActivityName).toBe('Flexão')
    expect(engine.getSnapshot().completedActivities).toBe(0)
  })

  it('should process overdue transitions when timer execution is delayed', () => {
    const events: IntervalTrainingEvent[] = []

    const engine = createSequenceEngine(createConfig(), {
      preparationDurationMs: 0,
      onEvent: (event) => events.push(event),
    })

    engine.start()

    vi.advanceTimersByTime(10_000)

    expect(engine.getSnapshot().phase).toBe('rest')
    expect(engine.getSnapshot().remainingMs).toBe(5_000)

    // Avança o relógio sem executar os callbacks do setInterval.
    // O próximo tick deverá processar as transições atrasadas.
    vi.setSystemTime(Date.now() + 17_900)

    vi.advanceTimersByTime(100)

    expect(engine.getSnapshot().currentActivityName).toBe('Flexão')
    expect(engine.getSnapshot().phase).toBe('activity')
    expect(engine.getSnapshot().remainingMs).toBe(8_000)
    expect(engine.getSnapshot().currentLoop).toBe(2)

    expect(events).toContainEqual({
      type: 'activity-start',
      name: 'Flexão',
    })
  })

  it('should reject an empty exercise sequence', () => {
    expect(() =>
      createSequenceEngine(
        createConfig({
          exercises: [],
        }),
      ),
    ).toThrow('The sequence must contain at least one exercise.')
  })

  it('should reject invalid loop count', () => {
    expect(() =>
      createSequenceEngine(
        createConfig({
          loops: 0,
        }),
      ),
    ).toThrow('The number of loops must be a positive integer.')
  })

  it('should reject invalid exercise duration', () => {
    expect(() =>
      createSequenceEngine(
        createConfig({
          exercises: [
            {
              id: '1',
              name: 'Flexão',
              durationSeconds: 0,
              restDurationSeconds: 5,
            },
          ],
        }),
      ),
    ).toThrow('Exercise "Flexão" must have a positive finite duration.')
  })

  it('should reject invalid rest duration', () => {
    expect(() =>
      createSequenceEngine(
        createConfig({
          exercises: [
            {
              id: '1',
              name: 'Flexão',
              durationSeconds: 10,
              restDurationSeconds: -1,
            },
          ],
        }),
      ),
    ).toThrow(
      'Exercise "Flexão" must have a non-negative finite rest duration.',
    )
  })
})
