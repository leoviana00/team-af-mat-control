
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import { useIntervalTraining } from '../hooks/use-interval-training'

import type {
  ExerciseSequenceConfig,
  IntervalTrainingConfig,
  IntervalTrainingEvent,
  RepeatedIntervalConfig,
} from '../types/interval-training'

import type {
  IntervalAudioPreferences,
} from '../types/interval-audio-preferences'

import {
  getIntervalAudioPreferences,
  saveIntervalAudioPreferences,
} from '../services/interval-audio-preferences'

import {
  playIntervalAudio,
  unlockIntervalAudio,
} from '../services/interval-audio'

import { IntervalTrainingConfig as IntervalTrainingConfigPanel } from './interval-training-config'
import { IntervalTrainingSequenceConfig } from './interval-training-sequence-config'
import { IntervalTrainingDisplay } from './interval-training-display'
import { IntervalTrainingPresets } from './interval-training-presets'
import { IntervalAudioSettings } from './interval-audio-settings'

import './interval-training.css'

const INITIAL_CONFIG: IntervalTrainingConfig = {
  preparationDurationSeconds: 5,
  workout: {
    type: 'repeated',
    activityDurationSeconds: 30,
    restDurationSeconds: 15,
    repetitions: 10,
    restAfterLastActivity: false,
  },
}

const INITIAL_SEQUENCE: ExerciseSequenceConfig = {
  type: 'sequence',
  exercises: [
    {
      id: 'exercise-flexao',
      name: 'Flexão de braço',
      durationSeconds: 30,
      restDurationSeconds: 15,
    },
    {
      id: 'exercise-agachamento',
      name: 'Agachamento',
      durationSeconds: 30,
      restDurationSeconds: 15,
    },
  ],
  loops: 3,
  restAfterLastActivity: false,
}

function cloneConfig(
  config: IntervalTrainingConfig,
): IntervalTrainingConfig {
  return JSON.parse(JSON.stringify(config)) as IntervalTrainingConfig
}

export function IntervalTraining() {
  const timerContainerRef = useRef<HTMLElement>(null)
  const [isTvMode, setIsTvMode] = useState(false)

  const [audioPreferences, setAudioPreferences] =
    useState<IntervalAudioPreferences>(
      getIntervalAudioPreferences,
    )

  // Callback estável: consulta as preferências no momento do evento,
  // sem provocar a recriação do motor quando elas forem alteradas.
  const handleIntervalEvent = useCallback(
    (event: IntervalTrainingEvent) => {
      const preferences = getIntervalAudioPreferences()
      playIntervalAudio(event, preferences)
    },
    [],
  )

  const {
    config,
    snapshot,
    isConfigLocked,
    start,
    pause,
    resume,
    reset,
    cancel,
    updateConfig,
  } = useIntervalTraining(INITIAL_CONFIG, {
    tickIntervalMs: 100,
    onEvent: handleIntervalEvent,
  })

  const [baselineConfig, setBaselineConfig] = useState(
    () => cloneConfig(INITIAL_CONFIG),
  )

  // Mantém o estado visual sincronizado com a Fullscreen API.
  // Também permite sair do modo TV quando o usuário pressiona ESC.
  useEffect(() => {
    function handleFullscreenChange() {
      const isNativeFullscreen =
        document.fullscreenElement === timerContainerRef.current

      if (isNativeFullscreen) {
        setIsTvMode(true)
        return
      }

      if (!document.fullscreenElement) {
        setIsTvMode(false)
      }
    }

    document.addEventListener(
      'fullscreenchange',
      handleFullscreenChange,
    )

    return () => {
      document.removeEventListener(
        'fullscreenchange',
        handleFullscreenChange,
      )
    }
  }, [])

  const isDirty =
    JSON.stringify(config) !== JSON.stringify(baselineConfig)

  const isActive =
    snapshot.status === 'preparing' ||
    snapshot.status === 'active' ||
    snapshot.status === 'resting'

  const canStart =
    snapshot.status === 'idle' &&
    (config.workout.type === 'repeated' ||
      config.workout.exercises.length > 0)

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

    // Ativa o modo visual mesmo quando o navegador
    // não oferece suporte à Fullscreen API.
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

  function handleAudioPreferencesChange(
    nextPreferences: IntervalAudioPreferences,
  ) {
    setAudioPreferences(nextPreferences)
    saveIntervalAudioPreferences(nextPreferences)
  }

  function handleModeChange(mode: 'repeated' | 'sequence') {
    if (isConfigLocked || config.workout.type === mode) {
      return
    }

    if (mode === 'sequence') {
      updateConfig({
        ...config,
        workout: cloneConfig({
          ...config,
          workout: INITIAL_SEQUENCE,
        }).workout,
      })
      return
    }

    updateConfig({
      ...config,
      workout: cloneConfig({
        ...config,
        workout: INITIAL_CONFIG.workout,
      }).workout,
    })
  }

  function handleRepeatedConfigChange(
    nextConfig: RepeatedIntervalConfig,
  ) {
    updateConfig({
      ...config,
      workout: nextConfig,
    })
  }

  function handleSequenceConfigChange(
    nextConfig: ExerciseSequenceConfig,
  ) {
    updateConfig({
      ...config,
      workout: nextConfig,
    })
  }

  function handleLoadPreset(nextConfig: IntervalTrainingConfig) {
    const independentConfig = cloneConfig(nextConfig)

    setBaselineConfig(cloneConfig(independentConfig))
    updateConfig(independentConfig)
  }

  function handleSavePreset() {
    setBaselineConfig(cloneConfig(config))
  }

  function handleStart() {
    unlockIntervalAudio()
    start()
  }

  function handleResume() {
    unlockIntervalAudio()
    resume()
  }

  function handleRestart() {
    reset()
  }

  return (
    <section
      ref={timerContainerRef}
      className={`interval-training ${isTvMode ? 'tv-mode' : ''}`}
    >
      <button
        type="button"
        className="interval-tv-mode-toggle"
        onClick={handleToggleTvMode}
        aria-label={
          isTvMode ? 'Sair do modo TV' : 'Entrar no modo TV'
        }
      >
        {isTvMode ? 'SAIR DO MODO TV' : 'MODO TV'}
      </button>

      <div className="interval-training-header">
        <div>
          <span className="interval-eyebrow">CONDICIONAMENTO</span>

          <h2>Interval Training</h2>

          <p>
            Organize ciclos de atividade e descanso para o seu treino.
          </p>
        </div>

        <span className="interval-training-tag">
          {isConfigLocked ? 'SESSÃO EM ANDAMENTO' : 'CONFIGURAÇÃO LIVRE'}
        </span>
      </div>

      <div className="interval-mode-selector" aria-label="Formato do treino">
        <button
          type="button"
          className={
            config.workout.type === 'repeated' ? 'active' : ''
          }
          disabled={isConfigLocked}
          aria-pressed={config.workout.type === 'repeated'}
          onClick={() => handleModeChange('repeated')}
        >
          INTERVALOS REPETIDOS
        </button>

        <button
          type="button"
          className={
            config.workout.type === 'sequence' ? 'active' : ''
          }
          disabled={isConfigLocked}
          aria-pressed={config.workout.type === 'sequence'}
          onClick={() => handleModeChange('sequence')}
        >
          SEQUÊNCIA DE EXERCÍCIOS
        </button>
      </div>

      <IntervalTrainingPresets
        config={config}
        disabled={isConfigLocked}
        isDirty={isDirty}
        onLoad={handleLoadPreset}
        onSave={handleSavePreset}
      />

      <div className="interval-training-layout">
        {config.workout.type === 'repeated' ? (
          <IntervalTrainingConfigPanel
            config={config.workout}
            disabled={isConfigLocked}
            onChange={handleRepeatedConfigChange}
          />
        ) : (
          <IntervalTrainingSequenceConfig
            config={config.workout}
            disabled={isConfigLocked}
            onChange={handleSequenceConfigChange}
          />
        )}

        <div className="interval-execution">
          <IntervalTrainingDisplay
            snapshot={snapshot}
            mode={config.workout.type}
          />

          <div className="interval-controls">
            {canStart && (
              <button
                type="button"
                className="interval-button primary"
                onClick={handleStart}
              >
                INICIAR TREINO
              </button>
            )}

            {snapshot.status === 'paused' && (
              <button
                type="button"
                className="interval-button primary"
                onClick={handleResume}
              >
                CONTINUAR
              </button>
            )}

            {isActive && (
              <button
                type="button"
                className="interval-button primary"
                onClick={pause}
              >
                PAUSAR
              </button>
            )}

            {(snapshot.status === 'completed' ||
              snapshot.status === 'cancelled') && (
              <button
                type="button"
                className="interval-button primary"
                onClick={handleRestart}
              >
                NOVO TREINO
              </button>
            )}

            {snapshot.status !== 'idle' &&
              snapshot.status !== 'completed' &&
              snapshot.status !== 'cancelled' && (
                <button
                  type="button"
                  className="interval-button secondary"
                  onClick={reset}
                >
                  REINICIAR
                </button>
              )}

            {(isActive || snapshot.status === 'paused') && (
              <button
                type="button"
                className="interval-button danger"
                onClick={cancel}
              >
                ENCERRAR
              </button>
            )}
          </div>

          <p className="interval-preparation-note">
            Preparação inicial de {config.preparationDurationSeconds} segundos.
          </p>
        </div>
      </div>

      <div className="interval-audio-settings-container">
        <IntervalAudioSettings
          preferences={audioPreferences}
          onChange={handleAudioPreferencesChange}
        />
      </div>
    </section>
  )
}
