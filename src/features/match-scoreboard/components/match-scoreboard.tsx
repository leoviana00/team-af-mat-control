
import { useEffect, useRef, useState } from 'react'

import { useMatchScoreboard } from '../hooks/use-match-scoreboard'
import type {
  MatchEndReason,
  MatchSide,
} from '../types/match-scoreboard'

import './match-scoreboard.css'

const INITIAL_DURATION_SECONDS = 5 * 60

function formatTime(milliseconds: number) {
  const totalSeconds = Math.ceil(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const endReasonLabels: Record<MatchEndReason, string> = {
  time: 'Tempo',
  submission: 'Finalização',
  disqualification: 'Desclassificação',
  'referee-decision': 'Decisão do árbitro',
}

export function MatchScoreboard() {
  const {
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
  } = useMatchScoreboard({
    durationSeconds: INITIAL_DURATION_SECONDS,
  })

  const [durationMinutes, setDurationMinutes] = useState('5')

  const timerContainerRef = useRef<HTMLElement>(null)
  const [isTvMode, setIsTvMode] = useState(false)

  useEffect(() => {
    function handleFullscreenChange() {
      const isNativeFullscreen =
        document.fullscreenElement === timerContainerRef.current

      if (isNativeFullscreen) {
        setIsTvMode(true)
        return
      }

      // Se outra área entrar em fullscreen, este módulo deixa o modo TV.
      setIsTvMode(false)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener(
        'fullscreenchange',
        handleFullscreenChange,
      )
    }
  }, [])

  async function handleToggleTvMode() {
    const container = timerContainerRef.current

    if (!container) {
      return
    }

    if (isTvMode) {
      setIsTvMode(false)

      if (
        document.fullscreenElement === container &&
        typeof document.exitFullscreen === 'function'
      ) {
        try {
          await document.exitFullscreen()
        } catch (error) {
          console.warn(
            'Não foi possível sair da tela cheia nativa:',
            error,
          )
        }
      }

      return
    }

    setIsTvMode(true)

    if (typeof container.requestFullscreen !== 'function') {
      return
    }

    try {
      await container.requestFullscreen()
    } catch (error) {
      console.warn(
        'Tela cheia nativa indisponível. Mantendo modo TV visual:',
        error,
      )
    }
  }

  const [pendingEnd, setPendingEnd] = useState<{
    reason: Exclude<MatchEndReason, 'time'>
    winner: MatchSide
  } | null>(null)

  const isFinished = snapshot.status === 'finished'
  const isRunning = snapshot.status === 'running'
  const isPaused = snapshot.status === 'paused'

  function handleDurationChange(value: string) {
    setDurationMinutes(value)

    const minutes = Number(value)

    if (Number.isFinite(minutes) && minutes > 0) {
      updateConfig({
        durationSeconds: Math.round(minutes * 60),
      })
    }
  }

  function handleManualEnd(
    reason: Exclude<MatchEndReason, 'time'>,
    winner: MatchSide,
  ) {
    setPendingEnd({ reason, winner })
  }

  function handleConfirmEnd() {
    if (!pendingEnd) return

    endMatch(pendingEnd.reason, pendingEnd.winner)
    setPendingEnd(null)
  }

  function handleCancelEnd() {
    setPendingEnd(null)
  }

  function handleReset() {
    reset()
    setPendingEnd(null)
  }

  return (
    <section
      ref={timerContainerRef}
      className={`match-scoreboard${isTvMode ? ' match-scoreboard-tv' : ''}`}
    >
      <div className="match-scoreboard-toolbar">
        <div>
          <span className="match-scoreboard-eyebrow">
            MATCH CONTROL
          </span>
          <h3>Placar da luta</h3>
        </div>

        <button
          type="button"
          className="match-tv-toggle"
          aria-pressed={isTvMode}
          onClick={handleToggleTvMode}
        >
          {isTvMode ? 'Sair do modo TV' : 'Modo TV'}
        </button>

        <span className={`match-status match-status-${snapshot.status}`}>
          {snapshot.status === 'idle' && 'PRONTO'}
          {snapshot.status === 'running' && 'EM ANDAMENTO'}
          {snapshot.status === 'paused' && 'PAUSADO'}
          {snapshot.status === 'finished' && 'ENCERRADO'}
        </span>
      </div>

      <div className="match-scoreboard-config">
        <label htmlFor="match-duration">Duração da luta</label>

        <div className="match-duration-control">
          <input
            id="match-duration"
            type="number"
            min="1"
            max="30"
            value={durationMinutes}
            disabled={isConfigLocked}
            onChange={(event) =>
              handleDurationChange(event.target.value)
            }
          />
          <span>min</span>
        </div>
      </div>

      <div className="match-scoreboard-board">
        <article className="match-side match-side-blue">
          <div className="match-side-heading">
            <span className="match-side-indicator" />
            <h4>AZUL</h4>
          </div>

          <div className="match-points">
            {snapshot.blue.points}
          </div>

          <div className="match-score-details">
            <div>
              <span>Vantagens</span>
              <strong>{snapshot.blue.advantages}</strong>
            </div>

            <div>
              <span>Punições</span>
              <strong>{snapshot.blue.penalties}</strong>
            </div>
          </div>

          <div className="match-score-actions">
            {[2, 3, 4].map((points) => (
              <button
                key={points}
                type="button"
                disabled={isFinished}
                onClick={() =>
                  scorePoints('blue', points as 2 | 3 | 4)
                }
              >
                +{points}
              </button>
            ))}

            <button
              type="button"
              className="match-action-secondary"
              disabled={isFinished}
              onClick={() => scoreAdvantage('blue')}
            >
              + Vant.
            </button>

            <button
              type="button"
              className="match-action-penalty"
              disabled={isFinished}
              onClick={() => scorePenalty('blue')}
            >
              + Pun.
            </button>
          </div>
        </article>

        <div className="match-scoreboard-center">
          <span className="match-timer-label">TEMPO</span>

          <div className="match-timer">
            {formatTime(snapshot.remainingMs)}
          </div>

          <span className="match-timer-elapsed">
            Decorrido {formatTime(snapshot.elapsedMs)}
          </span>

          <div className="match-timer-controls">
            {snapshot.status === 'idle' && (
              <button
                type="button"
                className="match-button-primary"
                onClick={start}
              >
                Iniciar luta
              </button>
            )}

            {isRunning && (
              <button
                type="button"
                className="match-button-secondary"
                onClick={pause}
              >
                Pausar
              </button>
            )}

            {isPaused && (
              <button
                type="button"
                className="match-button-primary"
                onClick={resume}
              >
                Retomar
              </button>
            )}

            {!isFinished && snapshot.status !== 'idle' && (
              <button
                type="button"
                className="match-button-reset"
                onClick={handleReset}
              >
                Reiniciar
              </button>
            )}

            {isFinished && (
              <button
                type="button"
                className="match-button-primary"
                onClick={handleReset}
              >
                Nova luta
              </button>
            )}
          </div>
        </div>

        <article className="match-side match-side-white">
          <div className="match-side-heading">
            <span className="match-side-indicator" />
            <h4>BRANCO</h4>
          </div>

          <div className="match-points">
            {snapshot.white.points}
          </div>

          <div className="match-score-details">
            <div>
              <span>Vantagens</span>
              <strong>{snapshot.white.advantages}</strong>
            </div>

            <div>
              <span>Punições</span>
              <strong>{snapshot.white.penalties}</strong>
            </div>
          </div>

          <div className="match-score-actions">
            {[2, 3, 4].map((points) => (
              <button
                key={points}
                type="button"
                disabled={isFinished}
                onClick={() =>
                  scorePoints('white', points as 2 | 3 | 4)
                }
              >
                +{points}
              </button>
            ))}

            <button
              type="button"
              className="match-action-secondary"
              disabled={isFinished}
              onClick={() => scoreAdvantage('white')}
            >
              + Vant.
            </button>

            <button
              type="button"
              className="match-action-penalty"
              disabled={isFinished}
              onClick={() => scorePenalty('white')}
            >
              + Pun.
            </button>
          </div>
        </article>
      </div>

      {isFinished && snapshot.result && (
        <div className="match-result">
          <span>RESULTADO</span>

          <strong>
            {snapshot.result.winner === 'draw'
              ? 'Empate'
              : snapshot.result.winner === 'blue'
                ? 'Vitória do Azul'
                : 'Vitória do Branco'}
          </strong>

          <p>
            Encerramento: {endReasonLabels[snapshot.result.reason]}
          </p>
        </div>
      )}

      {!isFinished && (
        <div className="match-end-controls">
          <span>Encerrar luta</span>

          <div className="match-end-options">
            {(
              [
                ['submission', 'Finalização'],
                ['disqualification', 'Desclassificação'],
                ['referee-decision', 'Decisão do árbitro'],
              ] as const
            ).map(([reason, label]) => (
              <div className="match-end-option" key={reason}>
                <span>{label}</span>

                <button
                  type="button"
                  onClick={() =>
                    handleManualEnd(reason, 'blue')
                  }
                >
                  Azul
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleManualEnd(reason, 'white')
                  }
                >
                  Branco
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingEnd && (
        <div className="match-end-confirmation">
          <div
            className="match-end-confirmation-backdrop"
            aria-hidden="true"
          />

          <div
            className="match-end-confirmation-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="match-end-confirmation-title"
          >
            <span className="match-scoreboard-eyebrow">
              CONFIRMAR ENCERRAMENTO
            </span>

            <h4 id="match-end-confirmation-title">
              {endReasonLabels[pendingEnd.reason]}
            </h4>

            <p>
              Confirmar vitória do{' '}
              {pendingEnd.winner === 'blue' ? 'Azul' : 'Branco'}?
            </p>

            <div className="match-end-confirmation-actions">
              <button
                type="button"
                className="match-button-secondary"
                onClick={handleCancelEnd}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="match-button-primary"
                onClick={handleConfirmEnd}
              >
                Confirmar encerramento
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
