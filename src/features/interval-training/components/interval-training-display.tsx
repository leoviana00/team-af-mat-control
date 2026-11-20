
import type {
  IntervalTrainingMode,
  IntervalTrainingSnapshot,
} from '../types/interval-training'

interface IntervalTrainingDisplayProps {
  snapshot: IntervalTrainingSnapshot
  mode?: IntervalTrainingMode
}

function formatTime(milliseconds: number): string {
  const totalSeconds = Math.ceil(Math.max(0, milliseconds) / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const statusLabels = {
  idle: 'PRONTO PARA INICIAR',
  preparing: 'PREPARANDO...',
  active: 'EM ATIVIDADE',
  resting: 'DESCANSO',
  paused: 'PAUSADO',
  completed: 'TREINO FINALIZADO',
  cancelled: 'TREINO ENCERRADO',
}

export function IntervalTrainingDisplay({
  snapshot,
  mode = 'repeated',
}: IntervalTrainingDisplayProps) {
  const displayedTime =
    snapshot.status === 'preparing'
      ? snapshot.preparationRemainingMs
      : snapshot.remainingMs

  const phaseLabel =
    snapshot.status === 'preparing'
      ? 'PREPARAÇÃO'
      : snapshot.phase === 'activity'
        ? 'ATIVIDADE'
        : snapshot.phase === 'rest'
          ? 'DESCANSO'
          : 'AGUARDANDO'

  const progress = Math.min(
    100,
    Math.max(0, snapshot.progressPercentage),
  )

  const progressContext =
    mode === 'sequence'
      ? `Volta ${snapshot.currentLoop} de ${snapshot.totalLoops}`
      : `Repetição ${snapshot.currentRepetition} de ${snapshot.totalRepetitions}`

  return (
    <section className="interval-display">
      <div className="interval-display-top">
        <div>
          <span className="interval-eyebrow">SESSÃO ATUAL</span>
          <h3>{snapshot.currentActivityName ?? 'Interval Training'}</h3>
        </div>

        <div
          className={`interval-phase ${snapshot.phase ?? ''} ${snapshot.status}`}
        >
          {phaseLabel}
        </div>
      </div>

      <div
        className={`interval-timer ${
          snapshot.status === 'completed' ? 'completed' : ''
        } ${snapshot.status === 'resting' ? 'resting' : ''} ${
          snapshot.status === 'preparing' ? 'preparing' : ''
        }`}
        aria-live="off"
        role="timer"
        aria-label={`Tempo restante: ${formatTime(displayedTime)}`}
      >
        {formatTime(displayedTime)}
      </div>

      <div className={`interval-status ${snapshot.status}`}>
        <span className="status-dot" />
        {statusLabels[snapshot.status]}
      </div>

      <div className="interval-progress">
        <div className="interval-progress-heading">
          <span>PROGRESSO DO TREINO</span>
          <strong>{Math.round(progress)}%</strong>
        </div>

        <div
          className="interval-progress-track"
          role="progressbar"
          aria-label="Progresso do treino"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <div
            className="interval-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="interval-progress-details">
          <span>
            {snapshot.completedActivities} de {snapshot.totalActivities} atividades
          </span>

          <span>{progressContext}</span>
        </div>
      </div>

      <div className="interval-next">
        <span>PRÓXIMA ATIVIDADE</span>
        <strong>
          {snapshot.nextActivityName ?? (
            snapshot.status === 'completed'
              ? 'Treino concluído'
              : '—'
          )}
        </strong>
      </div>
    </section>
  )
}
