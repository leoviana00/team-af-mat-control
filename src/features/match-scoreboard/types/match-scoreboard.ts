export type MatchSide = 'blue' | 'white'

export type MatchStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'finished'

export type MatchEndReason =
  | 'time'
  | 'submission'
  | 'disqualification'
  | 'referee-decision'

export interface MatchScore {
  points: number
  advantages: number
  penalties: number
}

export interface MatchConfig {
  durationSeconds: number
}

export interface MatchResult {
  winner: MatchSide | 'draw'
  reason: MatchEndReason
}

export interface MatchSnapshot {
  status: MatchStatus
  elapsedMs: number
  remainingMs: number
  blue: MatchScore
  white: MatchScore
  result: MatchResult | null
}
