
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import {
  createRoundEngine,
  type RoundEvent,
} from '../engine/round-engine'

describe('Round Engine', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('should alternate between rounds and rest periods', () => {
    const engine = createRoundEngine({
      roundDurationMs: 1000,
      totalRounds: 2,
      restDurationMs: 500,
      preparationDurationMs: 0,
    })

    engine.start()

    expect(engine.getSnapshot()).toMatchObject({
      status: 'running',
      phase: 'round',
      currentRound: 1,
    })

    vi.advanceTimersByTime(1000)

    expect(engine.getSnapshot()).toMatchObject({
      phase: 'rest',
      currentRound: 1,
      remainingMs: 500,
    })

    vi.advanceTimersByTime(500)

    expect(engine.getSnapshot()).toMatchObject({
      phase: 'round',
      currentRound: 2,
      remainingMs: 1000,
    })

    vi.advanceTimersByTime(1000)

    expect(engine.getSnapshot()).toMatchObject({
      status: 'completed',
      phase: null,
      currentRound: 2,
    })
  })

  it('should pause and resume the current phase', () => {
    const engine = createRoundEngine({
      roundDurationMs: 5000,
      totalRounds: 2,
      restDurationMs: 1000,
      preparationDurationMs: 0,
    })

    engine.start()
    vi.advanceTimersByTime(2000)
    engine.pause()

    expect(engine.getSnapshot()).toMatchObject({
      status: 'paused',
      phase: 'round',
      remainingMs: 3000,
    })

    vi.advanceTimersByTime(2000)
    engine.start()

    vi.advanceTimersByTime(3000)

    expect(engine.getSnapshot()).toMatchObject({
      phase: 'rest',
      currentRound: 1,
    })
  })

  it('should reset the session', () => {
    const engine = createRoundEngine({
      roundDurationMs: 5000,
      totalRounds: 3,
      restDurationMs: 1000,
      preparationDurationMs: 0,
    })

    engine.start()
    vi.advanceTimersByTime(2000)
    engine.reset()

    expect(engine.getSnapshot()).toMatchObject({
      status: 'idle',
      phase: null,
      currentRound: 1,
      remainingMs: 5000,
      preparationRemainingMs: 0,
    })
  })

  it('should complete immediately after the last round by default', () => {
    const engine = createRoundEngine({
      roundDurationMs: 1000,
      totalRounds: 1,
      restDurationMs: 500,
      preparationDurationMs: 0,
    })

    engine.start()
    vi.advanceTimersByTime(1000)

    expect(engine.getSnapshot().status).toBe('completed')
  })

  it('should allow rest after the last round when configured', () => {
    const engine = createRoundEngine({
      roundDurationMs: 1000,
      totalRounds: 1,
      restDurationMs: 500,
      restAfterLastRound: true,
      preparationDurationMs: 0,
    })

    engine.start()
    vi.advanceTimersByTime(1000)

    expect(engine.getSnapshot()).toMatchObject({
      status: 'running',
      phase: 'rest',
      currentRound: 1,
      remainingMs: 500,
    })

    vi.advanceTimersByTime(500)

    expect(engine.getSnapshot().status).toBe('completed')
  })

  it('should emit events when rounds and rest periods change', () => {
    const events: RoundEvent[] = []

    const engine = createRoundEngine({
      roundDurationMs: 1000,
      totalRounds: 2,
      restDurationMs: 500,
      preparationDurationMs: 0,
      onEvent: (event) => events.push(event),
    })

    engine.start()
    vi.advanceTimersByTime(1000)
    vi.advanceTimersByTime(500)
    vi.advanceTimersByTime(1000)

    expect(events).toEqual([
      { type: 'round-start', round: 1 },
      { type: 'round-countdown', round: 1, seconds: 1 },
      { type: 'round-end', round: 1 },
      { type: 'rest-start', round: 1 },
      { type: 'rest-countdown', round: 1, seconds: 1 },
      { type: 'rest-end', round: 1 },
      { type: 'round-start', round: 2 },
      { type: 'round-countdown', round: 2, seconds: 1 },
      { type: 'round-end', round: 2 },
      { type: 'session-complete', round: 2 },
    ])
  })

  it('should emit a warning once when a phase reaches 10 seconds remaining', () => {
    const events: RoundEvent[] = []

    const engine = createRoundEngine({
      roundDurationMs: 20_000,
      totalRounds: 1,
      restDurationMs: 0,
      preparationDurationMs: 0,
      onEvent: (event) => events.push(event),
    })

    engine.start()
    vi.advanceTimersByTime(10_000)
    vi.advanceTimersByTime(5000)

    expect(
      events.filter((event) => event.type === 'round-warning'),
    ).toEqual([
      { type: 'round-warning', round: 1 },
    ])
  })

  it('should not repeat the warning after pausing and resuming', () => {
    const events: RoundEvent[] = []

    const engine = createRoundEngine({
      roundDurationMs: 20_000,
      totalRounds: 1,
      restDurationMs: 0,
      preparationDurationMs: 0,
      onEvent: (event) => events.push(event),
    })

    engine.start()
    vi.advanceTimersByTime(10_000)
    engine.pause()

    vi.advanceTimersByTime(5000)
    engine.start()
    vi.advanceTimersByTime(5000)

    expect(
      events.filter((event) => event.type === 'round-warning'),
    ).toHaveLength(1)
  })

  it('should not emit a 10-second warning for phases lasting 10 seconds or less', () => {
    const events: RoundEvent[] = []

    const engine = createRoundEngine({
      roundDurationMs: 5000,
      totalRounds: 1,
      restDurationMs: 0,
      preparationDurationMs: 0,
      onEvent: (event) => events.push(event),
    })

    engine.start()
    vi.advanceTimersByTime(5000)

    expect(
      events.filter((event) => event.type === 'round-warning'),
    ).toHaveLength(0)
  })

  it('should emit a warning during the rest period', () => {
    const events: RoundEvent[] = []

    const engine = createRoundEngine({
      roundDurationMs: 1000,
      totalRounds: 2,
      restDurationMs: 20_000,
      preparationDurationMs: 0,
      onEvent: (event) => events.push(event),
    })

    engine.start()
    vi.advanceTimersByTime(1000)
    vi.advanceTimersByTime(10_000)

    expect(
      events.filter((event) => event.type === 'rest-warning'),
    ).toEqual([
      { type: 'rest-warning', round: 1 },
    ])
  })

  it('should emit preparation countdown from 5 to 1 before the first round', () => {
    const events: RoundEvent[] = []

    const engine = createRoundEngine({
      roundDurationMs: 1000,
      totalRounds: 1,
      restDurationMs: 0,
      onEvent: (event) => events.push(event),
    })

    engine.start()

    expect(engine.getSnapshot()).toMatchObject({
      status: 'preparing',
      phase: null,
      currentRound: 1,
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
      type: 'round-start',
      round: 1,
    })

    expect(engine.getSnapshot()).toMatchObject({
      status: 'running',
      phase: 'round',
      remainingMs: 1000,
    })
  })

  it('should pause and resume preparation without repeating countdown events', () => {
    const events: RoundEvent[] = []

    const engine = createRoundEngine({
      roundDurationMs: 1000,
      totalRounds: 1,
      restDurationMs: 0,
      onEvent: (event) => events.push(event),
    })

    engine.start()
    vi.advanceTimersByTime(2000)
    engine.pause()

    expect(engine.getSnapshot()).toMatchObject({
      status: 'paused',
      phase: null,
      preparationRemainingMs: 3000,
    })

    vi.advanceTimersByTime(3000)
    engine.start()
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
      (event) => event.type === 'round-start',
    )).toHaveLength(1)
  })

  it('should reset preparation and allow a new countdown', () => {
    const events: RoundEvent[] = []

    const engine = createRoundEngine({
      roundDurationMs: 1000,
      totalRounds: 1,
      restDurationMs: 0,
      onEvent: (event) => events.push(event),
    })

    engine.start()
    vi.advanceTimersByTime(2000)
    engine.reset()

    expect(engine.getSnapshot()).toMatchObject({
      status: 'idle',
      phase: null,
      preparationRemainingMs: 5000,
    })

    engine.start()

    expect(events.filter(
      (event) => event.type === 'preparation-countdown',
    )).toEqual([
      { type: 'preparation-countdown', seconds: 5 },
      { type: 'preparation-countdown', seconds: 4 },
      { type: 'preparation-countdown', seconds: 3 },
      { type: 'preparation-countdown', seconds: 5 },
    ])
  })

  it('should emit final countdown from 5 to 1 during a round', () => {
    const events: RoundEvent[] = []

    const engine = createRoundEngine({
      roundDurationMs: 5000,
      totalRounds: 1,
      restDurationMs: 0,
      preparationDurationMs: 0,
      onEvent: (event) => events.push(event),
    })

    engine.start()
    vi.advanceTimersByTime(5000)

    expect(events.filter(
      (event) => event.type === 'round-countdown',
    )).toEqual([
      { type: 'round-countdown', round: 1, seconds: 5 },
      { type: 'round-countdown', round: 1, seconds: 4 },
      { type: 'round-countdown', round: 1, seconds: 3 },
      { type: 'round-countdown', round: 1, seconds: 2 },
      { type: 'round-countdown', round: 1, seconds: 1 },
    ])

    expect(engine.getSnapshot().status).toBe('completed')
  })

  it('should emit final countdown from 5 to 1 during rest', () => {
    const events: RoundEvent[] = []

    const engine = createRoundEngine({
      roundDurationMs: 1000,
      totalRounds: 2,
      restDurationMs: 5000,
      preparationDurationMs: 0,
      onEvent: (event) => events.push(event),
    })

    engine.start()
    vi.advanceTimersByTime(1000)
    vi.advanceTimersByTime(5000)

    expect(events.filter(
      (event) => event.type === 'rest-countdown',
    )).toEqual([
      { type: 'rest-countdown', round: 1, seconds: 5 },
      { type: 'rest-countdown', round: 1, seconds: 4 },
      { type: 'rest-countdown', round: 1, seconds: 3 },
      { type: 'rest-countdown', round: 1, seconds: 2 },
      { type: 'rest-countdown', round: 1, seconds: 1 },
    ])
  })

  it('should not repeat final countdown events after pausing and resuming a round', () => {
    const events: RoundEvent[] = []

    const engine = createRoundEngine({
      roundDurationMs: 10_000,
      totalRounds: 1,
      restDurationMs: 0,
      preparationDurationMs: 0,
      onEvent: (event) => events.push(event),
    })

    engine.start()
    vi.advanceTimersByTime(5000)
    engine.pause()

    vi.advanceTimersByTime(2000)
    engine.start()
    vi.advanceTimersByTime(5000)

    expect(events.filter(
      (event) => event.type === 'round-countdown',
    )).toEqual([
      { type: 'round-countdown', round: 1, seconds: 5 },
      { type: 'round-countdown', round: 1, seconds: 4 },
      { type: 'round-countdown', round: 1, seconds: 3 },
      { type: 'round-countdown', round: 1, seconds: 2 },
      { type: 'round-countdown', round: 1, seconds: 1 },
    ])
  })
})
