import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  addAdvantage,
  addPenalty,
  addPoints,
  advanceTime,
  createInitialSnapshot,
  finishMatch,
  pauseMatch,
  resetMatch,
  startMatch,
} from '../engine/match-scoreboard-engine'

import type {
  MatchConfig,
  MatchEndReason,
  MatchSide,
  MatchSnapshot,
} from '../types/match-scoreboard'

interface UseMatchScoreboardOptions {
  tickIntervalMs?: number
}

export function useMatchScoreboard(
  initialConfig: MatchConfig,
  options: UseMatchScoreboardOptions = {},
) {
  const { tickIntervalMs = 100 } = options

  const [config, setConfig] = useState(initialConfig)
  const [snapshot, setSnapshot] = useState<MatchSnapshot>(
    () => createInitialSnapshot(initialConfig),
  )

  useEffect(() => {
    if (snapshot.status !== 'running') {
      return
    }

    let lastTick = Date.now()

    const intervalId = setInterval(() => {
      const now = Date.now()
      const deltaMs = now - lastTick

      lastTick = now

      setSnapshot((currentSnapshot) =>
        advanceTime(currentSnapshot, deltaMs),
      )
    }, tickIntervalMs)

    return () => {
      clearInterval(intervalId)
    }
  }, [snapshot.status, tickIntervalMs])

  const start = useCallback(() => {
    setSnapshot((currentSnapshot) =>
      startMatch(currentSnapshot),
    )
  }, [])

  const pause = useCallback(() => {
    setSnapshot((currentSnapshot) =>
      pauseMatch(currentSnapshot),
    )
  }, [])

  const resume = useCallback(() => {
    setSnapshot((currentSnapshot) =>
      startMatch(currentSnapshot),
    )
  }, [])

  const reset = useCallback(() => {
    setSnapshot(resetMatch(config))
  }, [config])

  const scorePoints = useCallback(
    (side: MatchSide, points: 2 | 3 | 4) => {
      setSnapshot((currentSnapshot) =>
        addPoints(currentSnapshot, side, points),
      )
    },
    [],
  )

  const scoreAdvantage = useCallback(
    (side: MatchSide) => {
      setSnapshot((currentSnapshot) =>
        addAdvantage(currentSnapshot, side),
      )
    },
    [],
  )

  const scorePenalty = useCallback(
    (side: MatchSide) => {
      setSnapshot((currentSnapshot) =>
        addPenalty(currentSnapshot, side),
      )
    },
    [],
  )

  const endMatch = useCallback(
    (
      reason: MatchEndReason,
      winner?: MatchSide | 'draw',
    ) => {
      setSnapshot((currentSnapshot) =>
        finishMatch(currentSnapshot, reason, winner),
      )
    },
    [],
  )

  const updateConfig = useCallback(
    (nextConfig: MatchConfig): boolean => {
      if (
        snapshot.status !== 'idle' &&
        snapshot.status !== 'finished'
      ) {
        return false
      }

      if (
        !Number.isFinite(nextConfig.durationSeconds) ||
        nextConfig.durationSeconds <= 0
      ) {
        return false
      }

      setConfig(nextConfig)
      setSnapshot(createInitialSnapshot(nextConfig))

      return true
    },
    [snapshot.status],
  )

  const isConfigLocked =
    snapshot.status === 'running' ||
    snapshot.status === 'paused'

  return {
    config,
    snapshot,
    isConfigLocked,
    start,
    pause,
    resume,
    reset,
    scorePoints,
    scoreAdvantage,
    scorePenalty,
    endMatch,
    updateConfig,
  }
}
