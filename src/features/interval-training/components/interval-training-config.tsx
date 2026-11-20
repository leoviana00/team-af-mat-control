
import type { RepeatedIntervalConfig } from '../types/interval-training'

interface IntervalTrainingConfigProps {
  config: RepeatedIntervalConfig
  disabled: boolean
  onChange: (config: RepeatedIntervalConfig) => void
}

export function IntervalTrainingConfig({
  config,
  disabled,
  onChange,
}: IntervalTrainingConfigProps) {
  function updateConfig(
    changes: Partial<RepeatedIntervalConfig>,
  ) {
    onChange({
      ...config,
      ...changes,
    })
  }

  return (
    <section className="interval-config" aria-label="Configuração do treino">
      <div className="interval-config-heading">
        <span className="interval-eyebrow">CONFIGURAÇÃO</span>
        <h3>Intervalos repetidos</h3>
        <p>Defina a duração das atividades e dos descansos.</p>
      </div>

      <div className="interval-config-field">
        <label htmlFor="interval-activity-duration">
          TEMPO DE ATIVIDADE
        </label>

        <div className="interval-input-wrapper">
          <input
            id="interval-activity-duration"
            type="number"
            min="1"
            max="3600"
            value={config.activityDurationSeconds}
            disabled={disabled}
            onChange={(event) =>
              updateConfig({
                activityDurationSeconds: Math.min(
                  3600,
                  Math.max(1, Number(event.target.value) || 1),
                ),
              })
            }
          />
          <span>SEGUNDOS</span>
        </div>
      </div>

      <div className="interval-config-field">
        <label htmlFor="interval-rest-duration">
          TEMPO DE DESCANSO
        </label>

        <div className="interval-input-wrapper">
          <input
            id="interval-rest-duration"
            type="number"
            min="0"
            max="3600"
            value={config.restDurationSeconds}
            disabled={disabled}
            onChange={(event) =>
              updateConfig({
                restDurationSeconds: Math.min(
                  3600,
                  Math.max(0, Number(event.target.value) || 0),
                ),
              })
            }
          />
          <span>SEGUNDOS</span>
        </div>
      </div>

      <div className="interval-config-field">
        <label htmlFor="interval-repetitions">
          QUANTIDADE DE REPETIÇÕES
        </label>

        <div className="interval-input-wrapper">
          <input
            id="interval-repetitions"
            type="number"
            min="1"
            max="99"
            value={config.repetitions}
            disabled={disabled}
            onChange={(event) =>
              updateConfig({
                repetitions: Math.min(
                  99,
                  Math.max(1, Number(event.target.value) || 1),
                ),
              })
            }
          />
          <span>REPETIÇÕES</span>
        </div>
      </div>

      <label className="interval-final-rest">
        <input
          type="checkbox"
          checked={config.restAfterLastActivity}
          disabled={disabled}
          onChange={(event) =>
            updateConfig({
              restAfterLastActivity: event.target.checked,
            })
          }
        />

        <span>Incluir descanso após a última atividade</span>
      </label>

      <div className="interval-config-summary">
        <span>RESUMO DO TREINO</span>
        <strong>
          {config.repetitions} atividades
        </strong>
        <p>
          {config.activityDurationSeconds}s de atividade
          {' · '}
          {config.restDurationSeconds}s de descanso
        </p>
      </div>
    </section>
  )
}
