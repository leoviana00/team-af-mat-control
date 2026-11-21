
 // @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useMatchScoreboard } from '../hooks/use-match-scoreboard'

describe('useMatchScoreboard', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with the configured duration and empty score', () => {
    const { result } = renderHook(() =>
      useMatchScoreboard({ durationSeconds: 60 }),
    )

    expect(result.current.snapshot.status).toBe('idle')
    expect(result.current.snapshot.remainingMs).toBe(60_000)
    expect(result.current.snapshot.blue.points).toBe(0)
    expect(result.current.snapshot.white.points).toBe(0)
  })

  it('starts, pauses and resumes the match', () => {
    const { result } = renderHook(() =>
      useMatchScoreboard({ durationSeconds: 60 }),
    )

    act(() => {
      result.current.start()
    })

    expect(result.current.snapshot.status).toBe('running')

    act(() => {
      result.current.pause()
    })

    expect(result.current.snapshot.status).toBe('paused')

    act(() => {
      result.current.resume()
    })

    expect(result.current.snapshot.status).toBe('running')
  })

  it('advances the timer while running', () => {
    vi.useFakeTimers()

    const { result } = renderHook(() =>
      useMatchScoreboard(
        { durationSeconds: 60 },
        { tickIntervalMs: 100 },
      ),
    )

    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(1_000)
    })

    expect(result.current.snapshot.elapsedMs).toBeGreaterThanOrEqual(900)
    expect(result.current.snapshot.remainingMs).toBeLessThanOrEqual(59_100)
  })

  it('does not advance the timer while paused', () => {
    vi.useFakeTimers()

    const { result } = renderHook(() =>
      useMatchScoreboard(
        { durationSeconds: 60 },
        { tickIntervalMs: 100 },
      ),
    )

    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(1_000)
    })

    act(() => {
      result.current.pause()
    })

    const elapsedAtPause = result.current.snapshot.elapsedMs

    act(() => {
      vi.advanceTimersByTime(2_000)
    })

    expect(result.current.snapshot.elapsedMs).toBe(elapsedAtPause)
  })

  it('scores points, advantages and penalties', () => {
    const { result } = renderHook(() =>
      useMatchScoreboard({ durationSeconds: 60 }),
    )

    act(() => {
      result.current.scorePoints('blue', 3)
      result.current.scoreAdvantage('white')
      result.current.scorePenalty('blue')
    })

    expect(result.current.snapshot.blue.points).toBe(3)
    expect(result.current.snapshot.white.advantages).toBe(1)
    expect(result.current.snapshot.blue.penalties).toBe(1)
  })

  it('finishes the match when the timer reaches zero', () => {
    vi.useFakeTimers()

    const { result } = renderHook(() =>
      useMatchScoreboard(
        { durationSeconds: 1 },
        { tickIntervalMs: 100 },
      ),
    )

    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(1_000)
    })

    expect(result.current.snapshot.status).toBe('finished')
    expect(result.current.snapshot.remainingMs).toBe(0)
    expect(result.current.snapshot.result?.reason).toBe('time')
  })

  it('resets the score and timer', () => {
    const { result } = renderHook(() =>
      useMatchScoreboard({ durationSeconds: 60 }),
    )

    act(() => {
      result.current.start()
      result.current.scorePoints('blue', 4)
      result.current.reset()
    })

    expect(result.current.snapshot.status).toBe('idle')
    expect(result.current.snapshot.blue.points).toBe(0)
    expect(result.current.snapshot.remainingMs).toBe(60_000)
  })

  it('allows configuration update while idle', () => {
    const { result } = renderHook(() =>
      useMatchScoreboard({ durationSeconds: 60 }),
    )

    let updated = false

    act(() => {
      updated = result.current.updateConfig({
        durationSeconds: 120,
      })
    })

    expect(updated).toBe(true)
    expect(result.current.config.durationSeconds).toBe(120)
    expect(result.current.snapshot.remainingMs).toBe(120_000)
  })

  it('blocks configuration update while running', () => {
    const { result } = renderHook(() =>
      useMatchScoreboard({ durationSeconds: 60 }),
    )

    let updated = true

    act(() => {
      result.current.start()
    })

    act(() => {
      updated = result.current.updateConfig({
        durationSeconds: 120,
      })
    })

    expect(updated).toBe(false)
    expect(result.current.config.durationSeconds).toBe(60)
  })
})
