
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import {
  createTimerEngine,
  type TimerEvent,
} from '../engine/timer-engine'

describe('Timer Engine', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('should count up from zero after preparation is disabled', () => {
    const timer = createTimerEngine({
      mode: 'count-up',
      preparationDurationMs: 0,
    })

    timer.start()
    vi.advanceTimersByTime(3000)

    expect(timer.getSnapshot()).toMatchObject({
      status: 'running',
      stage: 'timer',
      elapsedMs: 3000,
      remainingMs: null,
    })
  })

  it('should pause and preserve elapsed time', () => {
    const timer = createTimerEngine({
      mode: 'count-up',
      preparationDurationMs: 0,
    })

    timer.start()
    vi.advanceTimersByTime(2000)
    timer.pause()

    vi.advanceTimersByTime(3000)

    expect(timer.getSnapshot()).toMatchObject({
      status: 'paused',
      elapsedMs: 2000,
    })
  })

  it('should resume from the paused time', () => {
    const timer = createTimerEngine({
      mode: 'count-up',
      preparationDurationMs: 0,
    })

    timer.start()
    vi.advanceTimersByTime(2000)
    timer.pause()
    timer.start()
    vi.advanceTimersByTime(1000)

    expect(timer.getSnapshot()).toMatchObject({
      status: 'running',
      elapsedMs: 3000,
    })
  })

  it('should complete countdown when reaching zero', () => {
    const timer = createTimerEngine({
      mode: 'countdown',
      durationMs: 5000,
      preparationDurationMs: 0,
    })

    timer.start()
    vi.advanceTimersByTime(5000)

    expect(timer.getSnapshot()).toMatchObject({
      status: 'completed',
      elapsedMs: 5000,
      remainingMs: 0,
    })
  })

  it('should emit preparation countdown from 5 to 1 before starting', () => {
    const events: TimerEvent[] = []

    const timer = createTimerEngine({
      mode: 'count-up',
      onEvent: (event) => events.push(event),
    })

    timer.start()

    expect(timer.getSnapshot()).toMatchObject({
      status: 'preparing',
      stage: 'preparation',
      elapsedMs: 0,
      preparationRemainingMs: 5000,
    })

    expect(events).toContainEqual({
      type: 'preparation-countdown',
      seconds: 5,
    })

    vi.advanceTimersByTime(5000)

    expect(events.filter(
      (event) => event.type === 'preparation-countdown',
    )).toEqual([
      { type: 'preparation-countdown', seconds: 5 },
      { type: 'preparation-countdown', seconds: 4 },
      { type: 'preparation-countdown', seconds: 3 },
      { type: 'preparation-countdown', seconds: 2 },
      { type: 'preparation-countdown', seconds: 1 },
    ])

    expect(events).toContainEqual({
      type: 'timer-start',
    })

    expect(timer.getSnapshot()).toMatchObject({
      status: 'running',
      stage: 'timer',
      elapsedMs: 0,
    })
  })

  it('should pause and resume preparation without repeating countdown events', () => {
    const events: TimerEvent[] = []

    const timer = createTimerEngine({
      mode: 'count-up',
      onEvent: (event) => events.push(event),
    })

    timer.start()
    vi.advanceTimersByTime(2000)
    timer.pause()

    expect(timer.getSnapshot()).toMatchObject({
      status: 'paused',
      stage: 'preparation',
      preparationRemainingMs: 3000,
    })

    vi.advanceTimersByTime(3000)

    expect(events.filter(
      (event) => event.type === 'preparation-countdown',
    )).toHaveLength(3)

    timer.start()
    vi.advanceTimersByTime(3000)

    expect(events.filter(
      (event) => event.type === 'preparation-countdown',
    )).toEqual([
      { type: 'preparation-countdown', seconds: 5 },
      { type: 'preparation-countdown', seconds: 4 },
      { type: 'preparation-countdown', seconds: 3 },
      { type: 'preparation-countdown', seconds: 2 },
      { type: 'preparation-countdown', seconds: 1 },
    ])

    expect(events.filter(
      (event) => event.type === 'timer-start',
    )).toHaveLength(1)
  })

  it('should emit final countdown from 5 to 1 before completing', () => {
    const events: TimerEvent[] = []

    const timer = createTimerEngine({
      mode: 'countdown',
      durationMs: 5000,
      preparationDurationMs: 0,
      onEvent: (event) => events.push(event),
    })

    timer.start()
    vi.advanceTimersByTime(5000)

    expect(events.filter(
      (event) => event.type === 'final-countdown',
    )).toEqual([
      { type: 'final-countdown', seconds: 5 },
      { type: 'final-countdown', seconds: 4 },
      { type: 'final-countdown', seconds: 3 },
      { type: 'final-countdown', seconds: 2 },
      { type: 'final-countdown', seconds: 1 },
    ])

    expect(events).toContainEqual({
      type: 'timer-complete',
    })

    expect(timer.getSnapshot().status).toBe('completed')
  })

  it('should not emit final countdown for count-up mode', () => {
    const events: TimerEvent[] = []

    const timer = createTimerEngine({
      mode: 'count-up',
      preparationDurationMs: 0,
      onEvent: (event) => events.push(event),
    })

    timer.start()
    vi.advanceTimersByTime(10_000)

    expect(events.filter(
      (event) => event.type === 'final-countdown',
    )).toHaveLength(0)
  })

  it('should not repeat final countdown events after pausing and resuming', () => {
    const events: TimerEvent[] = []

    const timer = createTimerEngine({
      mode: 'countdown',
      durationMs: 10_000,
      preparationDurationMs: 0,
      onEvent: (event) => events.push(event),
    })

    timer.start()
    vi.advanceTimersByTime(5000)
    timer.pause()

    vi.advanceTimersByTime(2000)
    timer.start()
    vi.advanceTimersByTime(5000)

    expect(events.filter(
      (event) => event.type === 'final-countdown',
    )).toEqual([
      { type: 'final-countdown', seconds: 5 },
      { type: 'final-countdown', seconds: 4 },
      { type: 'final-countdown', seconds: 3 },
      { type: 'final-countdown', seconds: 2 },
      { type: 'final-countdown', seconds: 1 },
    ])
  })

  it('should reset the timer and allow a new preparation countdown', () => {
    const events: TimerEvent[] = []

    const timer = createTimerEngine({
      mode: 'count-up',
      onEvent: (event) => events.push(event),
    })

    timer.start()
    vi.advanceTimersByTime(2000)
    timer.reset()

    expect(timer.getSnapshot()).toMatchObject({
      status: 'idle',
      stage: null,
      elapsedMs: 0,
      preparationRemainingMs: 5000,
    })

    timer.start()

    expect(events.filter(
      (event) => event.type === 'preparation-countdown',
    )).toEqual([
      { type: 'preparation-countdown', seconds: 5 },
      { type: 'preparation-countdown', seconds: 4 },
      { type: 'preparation-countdown', seconds: 3 },
      { type: 'preparation-countdown', seconds: 5 },
    ])
  })

  it('should reject countdown without a valid duration', () => {
    expect(() =>
      createTimerEngine({
        mode: 'countdown',
      }),
    ).toThrow('Countdown requires a duration greater than zero.')
  })
})
