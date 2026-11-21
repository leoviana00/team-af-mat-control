import type {
  MatchConfig,
  MatchEndReason,
  MatchScore,
  MatchSide,
  MatchSnapshot,
} from '../types/match-scoreboard'

const createEmptyScore = (): MatchScore => ({
  points: 0,
  advantages: 0,
  penalties: 0,
})

export function createInitialSnapshot(
  config: MatchConfig,
): MatchSnapshot {
  const durationMs = Math.max(0, config.durationSeconds * 1000)

  return {
    status: 'idle',
    elapsedMs: 0,
    remainingMs: durationMs,
    blue: createEmptyScore(),
    white: createEmptyScore(),
    result: null,
  }
}

export function startMatch(
  snapshot: MatchSnapshot,
): MatchSnapshot {
  if (snapshot.status !== 'idle' && snapshot.status !== 'paused') {
    return snapshot
  }

  if (snapshot.remainingMs <= 0) {
    return finishMatch(snapshot, 'time')
  }

  return {
    ...snapshot,
    status: 'running',
  }
}

export function pauseMatch(
  snapshot: MatchSnapshot,
): MatchSnapshot {
  if (snapshot.status !== 'running') {
    return snapshot
  }

  return {
    ...snapshot,
    status: 'paused',
  }
}

export function resetMatch(
  config: MatchConfig,
): MatchSnapshot {
  return createInitialSnapshot(config)
}

export function addPoints(
  snapshot: MatchSnapshot,
  side: MatchSide,
  points: 2 | 3 | 4,
): MatchSnapshot {
  if (snapshot.status === 'finished') {
    return snapshot
  }

  return {
    ...snapshot,
    [side]: {
      ...snapshot[side],
      points: snapshot[side].points + points,
    },
  }
}

export function addAdvantage(
  snapshot: MatchSnapshot,
  side: MatchSide,
): MatchSnapshot {
  if (snapshot.status === 'finished') {
    return snapshot
  }

  return {
    ...snapshot,
    [side]: {
      ...snapshot[side],
      advantages: snapshot[side].advantages + 1,
    },
  }
}

export function addPenalty(
  snapshot: MatchSnapshot,
  side: MatchSide,
): MatchSnapshot {
  if (snapshot.status === 'finished') {
    return snapshot
  }

  return {
    ...snapshot,
    [side]: {
      ...snapshot[side],
      penalties: snapshot[side].penalties + 1,
    },
  }
}

export function advanceTime(
  snapshot: MatchSnapshot,
  deltaMs: number,
): MatchSnapshot {
  if (snapshot.status !== 'running' || deltaMs <= 0) {
    return snapshot
  }

  const elapsedMs = snapshot.elapsedMs + deltaMs
  const remainingMs = Math.max(0, snapshot.remainingMs - deltaMs)

  const updatedSnapshot: MatchSnapshot = {
    ...snapshot,
    elapsedMs,
    remainingMs,
  }

  if (remainingMs === 0) {
    return finishMatch(updatedSnapshot, 'time')
  }

  return updatedSnapshot
}

export function finishMatch(
  snapshot: MatchSnapshot,
  reason: MatchEndReason,
  winner?: MatchSide | 'draw',
): MatchSnapshot {
  if (snapshot.status === 'finished') {
    return snapshot
  }

  const resolvedWinner =
    winner ?? (reason === 'time' ? determineWinner(snapshot) : 'draw')

  return {
    ...snapshot,
    status: 'finished',
    result: {
      winner: resolvedWinner,
      reason,
    },
  }
}

export function determineWinner(
  snapshot: MatchSnapshot,
): MatchSide | 'draw' {
  if (snapshot.blue.points !== snapshot.white.points) {
    return snapshot.blue.points > snapshot.white.points ? 'blue' : 'white'
  }

  if (snapshot.blue.advantages !== snapshot.white.advantages) {
    return snapshot.blue.advantages > snapshot.white.advantages
      ? 'blue'
      : 'white'
  }

  if (snapshot.blue.penalties !== snapshot.white.penalties) {
    return snapshot.blue.penalties < snapshot.white.penalties
      ? 'blue'
      : 'white'
  }

  return 'draw'
}
