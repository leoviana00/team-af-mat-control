import { describe, expect, it } from 'vitest'
import {
  addAdvantage,
  addPenalty,
  addPoints,
  advanceTime,
  createInitialSnapshot,
  determineWinner,
  finishMatch,
  pauseMatch,
  resetMatch,
  startMatch,
} from '../engine/match-scoreboard-engine'

const config = {
  durationSeconds: 300,
}

describe('match scoreboard engine', () => {
  it('creates an initial match snapshot', () => {
    const snapshot = createInitialSnapshot(config)

    expect(snapshot.status).toBe('idle')
    expect(snapshot.elapsedMs).toBe(0)
    expect(snapshot.remainingMs).toBe(300_000)
    expect(snapshot.blue.points).toBe(0)
    expect(snapshot.white.points).toBe(0)
    expect(snapshot.result).toBeNull()
  })

  it('adds points to the selected side', () => {
    const initial = createInitialSnapshot(config)

    const snapshot = addPoints(initial, 'blue', 2)
    const updated = addPoints(snapshot, 'white', 4)

    expect(updated.blue.points).toBe(2)
    expect(updated.white.points).toBe(4)
  })

  it('adds advantages and penalties', () => {
    const initial = createInitialSnapshot(config)

    const snapshot = addAdvantage(initial, 'blue')
    const updated = addPenalty(snapshot, 'white')

    expect(updated.blue.advantages).toBe(1)
    expect(updated.white.penalties).toBe(1)
  })

  it('determines winner by points, then advantages', () => {
    let snapshot = createInitialSnapshot(config)

    snapshot = addPoints(snapshot, 'blue', 2)
    snapshot = addPoints(snapshot, 'white', 2)
    snapshot = addAdvantage(snapshot, 'white')

    expect(determineWinner(snapshot)).toBe('white')
  })

  it('uses fewer penalties when points and advantages are tied', () => {
    let snapshot = createInitialSnapshot(config)

    snapshot = addPenalty(snapshot, 'blue')

    expect(determineWinner(snapshot)).toBe('white')
  })

  it('returns draw when all criteria are tied', () => {
    const snapshot = createInitialSnapshot(config)

    expect(determineWinner(snapshot)).toBe('draw')
  })

  it('starts, pauses and resumes the match', () => {
    const initial = createInitialSnapshot(config)
    const running = startMatch(initial)
    const paused = pauseMatch(running)
    const resumed = startMatch(paused)

    expect(running.status).toBe('running')
    expect(paused.status).toBe('paused')
    expect(resumed.status).toBe('running')
  })

  it('advances time and finishes when time runs out', () => {
    const initial = createInitialSnapshot({
      durationSeconds: 10,
    })

    const running = startMatch(initial)
    const finished = advanceTime(running, 10_000)

    expect(finished.status).toBe('finished')
    expect(finished.remainingMs).toBe(0)
    expect(finished.result?.reason).toBe('time')
    expect(finished.result?.winner).toBe('draw')
  })

  it('finishes with a manually selected winner', () => {
    const initial = createInitialSnapshot(config)

    const finished = finishMatch(
      initial,
      'submission',
      'blue',
    )

    expect(finished.status).toBe('finished')
    expect(finished.result).toEqual({
      winner: 'blue',
      reason: 'submission',
    })
  })

  it('resets the match to its initial state', () => {
    const initial = createInitialSnapshot(config)
    const running = startMatch(initial)
    const scored = addPoints(running, 'blue', 3)
    const reset = resetMatch(config)

    expect(scored.blue.points).toBe(3)
    expect(reset.status).toBe('idle')
    expect(reset.blue.points).toBe(0)
    expect(reset.remainingMs).toBe(300_000)
  })

  it('does not change the score after the match is finished', () => {
    const initial = createInitialSnapshot(config)
    const finished = finishMatch(initial, 'referee-decision', 'white')
    const updated = addPoints(finished, 'blue', 4)

    expect(updated.blue.points).toBe(0)
    expect(updated.status).toBe('finished')
  })
})