
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useTrainingTimer } from '../hooks/use-training-timer'
import {
  type TimerEvent,
  type TimerMode,
} from '../engine/timer-engine'
import {
  createRoundEngine,
  type RoundEvent,
  type RoundSnapshot,
  type RoundStatus,
} from '../engine/round-engine'
import {
  playTimerAudio,
  unlockTimerAudio,
} from '../services/timer-audio'
import {
  getAllPresets,
  saveCustomPreset,
  deleteCustomPreset,
} from '../services/training-timer-presets'
import type {
  TimerPresetConfig,
  TrainingTimerPreset,
} from '../types/training-timer-preset'
import { TrainingTimerPresets } from './training-timer-presets'
import './training-timer.css'

type TrainingMode = 'free' | 'rounds'

type AudioAlertSettings = Record<RoundEvent['type'], boolean>

interface TimerAudioPreferences {
  enabled: boolean
  alerts: AudioAlertSettings
}

const AUDIO_STORAGE_KEY = 'team-af-training-timer-audio'

const DEFAULT_AUDIO_PREFERENCES: TimerAudioPreferences = {
  enabled: true,
  alerts: {
    'preparation-countdown': true,
    'round-start': true,
    'round-warning': true,
    'round-countdown': true,
    'round-end': true,
    'rest-start': true,
    'rest-warning': true,
    'rest-countdown': true,
    'rest-end': true,
    'session-complete': true,
  },
}

const AUDIO_ALERT_LABELS: Record<RoundEvent['type'], string> = {
  'preparation-countdown': 'Contagem de preparação',
  'round-start': 'Início do round / cronômetro',
  'round-warning': 'Aviso de 10 segundos — round',
  'round-countdown': 'Últimos 5 segundos — round / cronômetro',
  'round-end': 'Fim do round',
  'rest-start': 'Início do descanso',
  'rest-warning': 'Aviso de 10 segundos — descanso',
  'rest-countdown': 'Últimos 5 segundos — descanso',
  'rest-end': 'Fim do descanso',
  'session-complete': 'Finalização da sessão',
}

function loadAudioPreferences(): TimerAudioPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_AUDIO_PREFERENCES
  }

  try {
    const stored = window.localStorage.getItem(AUDIO_STORAGE_KEY)

    if (!stored) {
      return DEFAULT_AUDIO_PREFERENCES
    }

    const parsed: unknown = JSON.parse(stored)

    if (typeof parsed !== 'object' || parsed === null) {
      return DEFAULT_AUDIO_PREFERENCES
    }

    const candidate = parsed as Partial<TimerAudioPreferences>

    const storedAlerts =
      typeof candidate.alerts === 'object' && candidate.alerts !== null
        ? candidate.alerts
        : {}

    const alerts = { ...DEFAULT_AUDIO_PREFERENCES.alerts }

    for (const key of Object.keys(alerts) as RoundEvent['type'][]) {
      const value = (storedAlerts as Partial<AudioAlertSettings>)[key]

      if (typeof value === 'boolean') {
        alerts[key] = value
      }
    }

    return {
      enabled:
        typeof candidate.enabled === 'boolean'
          ? candidate.enabled
          : DEFAULT_AUDIO_PREFERENCES.enabled,
      alerts,
    }
  } catch {
    return DEFAULT_AUDIO_PREFERENCES
  }
}

function formatTime(milliseconds: number): string {
  const totalSeconds = Math.ceil(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const statusLabels = {
  idle: 'PRONTO PARA INICIAR',
  preparing: 'PREPARANDO...',
  running: 'EM EXECUÇÃO',
  paused: 'PAUSADO',
  completed: 'FINALIZADO',
}

interface RoundTimerConfig {
  roundDurationMs: number
  totalRounds: number
  restDurationMs: number
  restAfterLastRound: boolean
}

interface AudioSettingsProps {
  preferences: TimerAudioPreferences
  onChange: (preferences: TimerAudioPreferences) => void
}

function AudioSettings({
  preferences,
  onChange,
}: AudioSettingsProps) {
  function toggleAlert(eventType: RoundEvent['type'], checked: boolean) {
    onChange({
      ...preferences,
      alerts: {
        ...preferences.alerts,
        [eventType]: checked,
      },
    })
  }

  return (
    <details className="timer-audio-settings">
      <summary>
        <span>CONFIGURAÇÕES DE ÁUDIO</span>
        <span
          className={`audio-indicator ${preferences.enabled ? 'active' : ''}`}
        >
          {preferences.enabled ? 'ATIVADO' : 'SILENCIADO'}
        </span>
      </summary>

      <div className="audio-settings-content">
        <label className="audio-setting master">
          <span>Áudio geral</span>
          <input
            type="checkbox"
            checked={preferences.enabled}
            onChange={(event) =>
              onChange({
                ...preferences,
                enabled: event.target.checked,
              })
            }
          />
        </label>

        <div className="audio-settings-divider" />

        {(Object.keys(AUDIO_ALERT_LABELS) as RoundEvent['type'][]).map(
          (eventType) => (
            <label className="audio-setting" key={eventType}>
              <span>{AUDIO_ALERT_LABELS[eventType]}</span>
              <input
                type="checkbox"
                checked={preferences.alerts[eventType]}
                disabled={!preferences.enabled}
                onChange={(event) =>
                  toggleAlert(eventType, event.target.checked)
                }
              />
            </label>
          ),
        )}
      </div>
    </details>
  )
}

interface RoundTimerPanelProps {
  config: RoundTimerConfig
  onStatusChange: (status: RoundStatus) => void
  audioEnabled: boolean
  audioAlerts: AudioAlertSettings
}

function RoundTimerPanel({
  config,
  onStatusChange,
  audioEnabled,
  audioAlerts,
}: RoundTimerPanelProps) {
  const [snapshot, setSnapshot] = useState<RoundSnapshot>(() => ({
    status: 'idle',
    phase: null,
    currentRound: 1,
    totalRounds: config.totalRounds,
    elapsedMs: 0,
    remainingMs: config.roundDurationMs,
    preparationRemainingMs: 5_000,
  }))

  const engineRef = useRef<ReturnType<typeof createRoundEngine> | null>(null)

  const audioPreferencesRef = useRef({
    enabled: audioEnabled,
    alerts: audioAlerts,
  })

  useEffect(() => {
    audioPreferencesRef.current = {
      enabled: audioEnabled,
      alerts: audioAlerts,
    }
  }, [audioEnabled, audioAlerts])

  const handleRoundEvent = useCallback((event: RoundEvent) => {
    const preferences = audioPreferencesRef.current

    if (
      preferences.enabled &&
      preferences.alerts[event.type]
    ) {
      playTimerAudio(event)
    }
  }, [])

  const createEngine = useCallback(() => {
    return createRoundEngine({
      roundDurationMs: config.roundDurationMs,
      totalRounds: config.totalRounds,
      restDurationMs: config.restDurationMs,
      restAfterLastRound: config.restAfterLastRound,
      tickIntervalMs: 100,
      onChange: (nextSnapshot) => {
        setSnapshot(nextSnapshot)
        onStatusChange(nextSnapshot.status)
      },
      onEvent: handleRoundEvent,
    })
  }, [
    config.roundDurationMs,
    config.totalRounds,
    config.restDurationMs,
    config.restAfterLastRound,
    onStatusChange,
    handleRoundEvent,
  ])

  useEffect(() => {
    return () => {
      engineRef.current?.pause()
      engineRef.current = null
    }
  }, [])

  const isRunning =
    snapshot.status === 'running' ||
    snapshot.status === 'preparing'

  const isCompleted = snapshot.status === 'completed'

  const phaseLabel =
    snapshot.status === 'preparing'
      ? 'PREPARAÇÃO'
      : snapshot.phase === 'round'
        ? 'ROUND'
        : snapshot.phase === 'rest'
          ? 'DESCANSO'
          : 'AGUARDANDO'

  const displayedTime =
    snapshot.status === 'preparing'
      ? snapshot.preparationRemainingMs
      : snapshot.remainingMs

  function handleStart() {
    unlockTimerAudio()

    if (!engineRef.current) {
      engineRef.current = createEngine()
    }

    engineRef.current.start()
  }

  function handlePause() {
    engineRef.current?.pause()
  }

  function handleReset() {
    engineRef.current?.reset()
  }

  return (
    <div className="round-timer">
      <div className="round-progress">
        <span>ROUND</span>
        <strong>
          {snapshot.currentRound}
          <small> / {snapshot.totalRounds}</small>
        </strong>
      </div>

      <div className={`round-phase ${snapshot.phase ?? ''}`}>
        {phaseLabel}
      </div>

      <div
        className={`timer-display ${isCompleted ? 'completed' : ''}`}
        style={{
          color:
            snapshot.status === 'preparing' ||
            snapshot.phase === 'rest'
              ? '#c92332'
              : undefined,
        }}
        aria-live="off"
      >
        {formatTime(displayedTime)}
      </div>

      <div className={`timer-status ${snapshot.status}`}>
        <span className="status-dot" />
        {statusLabels[snapshot.status]}
      </div>

      <div className="timer-controls">
        {!isRunning && !isCompleted && (
          <button
            className="timer-button primary"
            onClick={handleStart}
          >
            {snapshot.status === 'paused' ? 'CONTINUAR' : 'INICIAR'}
          </button>
        )}

        {isRunning && (
          <button
            className="timer-button primary"
            onClick={handlePause}
          >
            PAUSAR
          </button>
        )}

        <button
          className="timer-button secondary"
          onClick={handleReset}
          disabled={snapshot.status === 'idle'}
        >
          REINICIAR
        </button>
      </div>

      {isCompleted && (
        <p className="timer-completion">SESSÃO FINALIZADA</p>
      )}
    </div>
  )
}

export function TrainingTimer() {
  const timerContainerRef = useRef<HTMLElement>(null)
  const [isTvMode, setIsTvMode] = useState(false)

  const [trainingMode, setTrainingMode] = useState<TrainingMode>('free')

  const [mode, setMode] = useState<TimerMode>('count-up')
  const [minutes, setMinutes] = useState(5)
  const [seconds, setSeconds] = useState(0)

  const [roundMinutes, setRoundMinutes] = useState(5)
  const [roundSeconds, setRoundSeconds] = useState(0)
  const [totalRounds, setTotalRounds] = useState(5)
  const [restMinutes, setRestMinutes] = useState(1)
  const [restSeconds, setRestSeconds] = useState(0)
  const [restAfterLastRound, setRestAfterLastRound] = useState(false)

  const [roundStatus, setRoundStatus] = useState<RoundStatus>('idle')

  const [audioPreferences, setAudioPreferences] =
    useState<TimerAudioPreferences>(loadAudioPreferences)

  const [presets, setPresets] =
    useState<TrainingTimerPreset[]>(getAllPresets)
  const [selectedPresetId, setSelectedPresetId] = useState('')

  useEffect(() => {
    function handleFullscreenChange() {
      const isNativeFullscreen =
        document.fullscreenElement === timerContainerRef.current

      if (isNativeFullscreen) {
        setIsTvMode(true)
        return
      }

      // Se o usuário sair da tela cheia nativa (por exemplo, com ESC),
      // também encerra o modo TV visual.
      if (!document.fullscreenElement) {
        setIsTvMode(false)
      }
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
      // Desativa primeiro a apresentação visual, sem depender do navegador.
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

    // O modo TV visual funciona mesmo quando a Fullscreen API
    // não existe ou não é permitida pelo navegador móvel.
    setIsTvMode(true)

    if (typeof container.requestFullscreen !== 'function') {
      return
    }

    try {
      await container.requestFullscreen()
    } catch (error) {
      // Mantém o modo TV visual quando a tela cheia nativa falha.
      console.warn(
        'Tela cheia nativa indisponível. Mantendo modo TV visual:',
        error,
      )
    }
  }

  const audioPreferencesRef = useRef(audioPreferences)

  useEffect(() => {
    audioPreferencesRef.current = audioPreferences
  }, [audioPreferences])

  useEffect(() => {
    try {
      window.localStorage.setItem(
        AUDIO_STORAGE_KEY,
        JSON.stringify(audioPreferences),
      )
    } catch {
      // A aplicação continua funcionando se o armazenamento estiver indisponível.
    }
  }, [audioPreferences])

  const handleFreeTimerEvent = useCallback((event: TimerEvent) => {
    const preferences = audioPreferencesRef.current

    if (!preferences.enabled) {
      return
    }

    let audioEvent: RoundEvent | null = null

    switch (event.type) {
      case 'preparation-countdown':
        audioEvent = {
          type: 'preparation-countdown',
          seconds: event.seconds,
        }
        break

      case 'timer-start':
        audioEvent = {
          type: 'round-start',
          round: 1,
        }
        break

      case 'final-countdown':
        audioEvent = {
          type: 'round-countdown',
          round: 1,
          seconds: event.seconds,
        }
        break

      case 'timer-complete':
        audioEvent = {
          type: 'session-complete',
          round: 1,
        }
        break
    }

    if (audioEvent && preferences.alerts[audioEvent.type]) {
      playTimerAudio(audioEvent)
    }
  }, [])

  const durationMs = (minutes * 60 + seconds) * 1000

  const {
    snapshot,
    start,
    pause,
    reset,
  } = useTrainingTimer({
    mode,
    durationMs: mode === 'countdown' ? durationMs : undefined,
    onEvent: handleFreeTimerEvent,
  })

  const displayedTime =
    snapshot.status === 'preparing'
      ? snapshot.preparationRemainingMs
      : mode === 'countdown'
        ? snapshot.remainingMs ?? durationMs
        : snapshot.elapsedMs

  const isRunning =
    snapshot.status === 'running' ||
    snapshot.status === 'preparing'

  const isCompleted = snapshot.status === 'completed'

  const roundConfig: RoundTimerConfig = {
    roundDurationMs: (roundMinutes * 60 + roundSeconds) * 1000,
    totalRounds,
    restDurationMs: (restMinutes * 60 + restSeconds) * 1000,
    restAfterLastRound,
  }

  const roundConfigKey = [
    roundConfig.roundDurationMs,
    roundConfig.totalRounds,
    roundConfig.restDurationMs,
    roundConfig.restAfterLastRound,
  ].join('-')

  const roundSessionInProgress =
    roundStatus === 'running' ||
    roundStatus === 'preparing' ||
    roundStatus === 'paused'

  const handleRoundStatusChange = useCallback(
    (status: RoundStatus) => {
      setRoundStatus(status)
    },
    [],
  )

  function handleStart() {
    if (mode === 'countdown' && durationMs <= 0) {
      return
    }

    unlockTimerAudio()
    start()
  }

  const currentPresetConfig: TimerPresetConfig =
    trainingMode === 'free'
      ? {
          type: 'free',
          mode,
          durationSeconds:
            mode === 'countdown' ? minutes * 60 + seconds : 0,
        }
      : {
          type: 'rounds',
          roundDurationSeconds: roundMinutes * 60 + roundSeconds,
          totalRounds,
          restDurationSeconds: restMinutes * 60 + restSeconds,
          restAfterLastRound,
        }

  const presetControlsDisabled =
    snapshot.status === 'running' ||
    snapshot.status === 'preparing' ||
    snapshot.status === 'paused' ||
    roundSessionInProgress

  function handleApplyPreset(preset: TrainingTimerPreset) {
    if (presetControlsDisabled) {
      return
    }

    if (preset.config.type === 'free') {
      const config = preset.config

      setTrainingMode('free')
      setMode(config.mode)
      setMinutes(Math.floor(config.durationSeconds / 60))
      setSeconds(config.durationSeconds % 60)
    } else {
      const config = preset.config

      setTrainingMode('rounds')
      setRoundMinutes(Math.floor(config.roundDurationSeconds / 60))
      setRoundSeconds(config.roundDurationSeconds % 60)
      setTotalRounds(config.totalRounds)
      setRestMinutes(Math.floor(config.restDurationSeconds / 60))
      setRestSeconds(config.restDurationSeconds % 60)
      setRestAfterLastRound(config.restAfterLastRound)
    }

    setSelectedPresetId(preset.id)
  }

  function handleSavePreset(
    name: string,
    description: string,
    config: TimerPresetConfig,
    id?: string,
  ) {
    if (presetControlsDisabled) {
      return null
    }

    const saved = saveCustomPreset({
      ...(id ? { id } : {}),
      name,
      description,
      config,
    })

    if (saved) {
      setPresets(getAllPresets())
      setSelectedPresetId(saved.id)
    }

    return saved
  }

  function handleDeletePreset(id: string): boolean {
    if (presetControlsDisabled) {
      return false
    }

    const deleted = deleteCustomPreset(id)

    if (deleted) {
      setPresets(getAllPresets())
      setSelectedPresetId('')
    }

    return deleted
  }

  return (
    <section
      ref={timerContainerRef}
      className={`training-timer ${isTvMode ? 'tv-mode' : ''}`}
    >
      <button
        type="button"
        className="tv-mode-toggle"
        onClick={handleToggleTvMode}
        aria-label={isTvMode ? 'Sair do modo TV' : 'Entrar no modo TV'}
      >
        {isTvMode ? 'SAIR DO MODO TV' : 'MODO TV'}
      </button>

      <div className="timer-mode-selector">
        <button
          className={trainingMode === 'free' ? 'selected' : ''}
          onClick={() => setTrainingMode('free')}
          disabled={
            (trainingMode === 'free' && isRunning) ||
            roundSessionInProgress
          }
        >
          CRONÔMETRO LIVRE
        </button>

        <button
          className={trainingMode === 'rounds' ? 'selected' : ''}
          onClick={() => setTrainingMode('rounds')}
          disabled={
            (trainingMode === 'free' && isRunning) ||
            roundSessionInProgress
          }
        >
          ROUND TIMER
        </button>
      </div>

      {trainingMode === 'free' ? (
        <>
          <div className="timer-mode-selector">
            <button
              className={mode === 'count-up' ? 'selected' : ''}
              onClick={() => setMode('count-up')}
              disabled={isRunning}
            >
              PROGRESSIVO
            </button>

            <button
              className={mode === 'countdown' ? 'selected' : ''}
              onClick={() => setMode('countdown')}
              disabled={isRunning}
            >
              REGRESSIVO
            </button>
          </div>

          <TrainingTimerPresets
            presets={presets}
            selectedPresetId={selectedPresetId}
            currentConfig={currentPresetConfig}
            disabled={presetControlsDisabled}
            onSelect={setSelectedPresetId}
            onApply={handleApplyPreset}
            onSave={handleSavePreset}
            onDelete={handleDeletePreset}
          />

          {mode === 'countdown' && (
            <div className="timer-configuration">
              <label>
                MINUTOS
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={minutes}
                  disabled={isRunning}
                  onChange={(event) =>
                    setMinutes(Math.max(0, Number(event.target.value)))
                  }
                />
              </label>

              <label>
                SEGUNDOS
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  disabled={isRunning}
                  onChange={(event) =>
                    setSeconds(
                      Math.min(59, Math.max(0, Number(event.target.value))),
                    )
                  }
                />
              </label>
            </div>
          )}

          <div
            className={`timer-display ${isCompleted ? 'completed' : ''}`}
            style={{
              color:
                snapshot.status === 'preparing'
                  ? '#c92332'
                  : undefined,
            }}
            aria-live="off"
          >
            {formatTime(displayedTime)}
          </div>

          <div className={`timer-status ${snapshot.status}`}>
            <span className="status-dot" />
            {statusLabels[snapshot.status]}
          </div>

          <div className="timer-controls">
            {!isRunning && !isCompleted && (
              <button className="timer-button primary" onClick={handleStart}>
                {snapshot.status === 'paused' ? 'CONTINUAR' : 'INICIAR'}
              </button>
            )}

            {isRunning && (
              <button
                className="timer-button primary"
                onClick={pause}
              >
                PAUSAR
              </button>
            )}

            <button
              className="timer-button secondary"
              onClick={reset}
              disabled={snapshot.status === 'idle'}
            >
              REINICIAR
            </button>
          </div>

          {isCompleted && (
            <p className="timer-completion">TEMPO ENCERRADO</p>
          )}
        </>
      ) : (
        <>
          <TrainingTimerPresets
            presets={presets}
            selectedPresetId={selectedPresetId}
            currentConfig={currentPresetConfig}
            disabled={presetControlsDisabled}
            onSelect={setSelectedPresetId}
            onApply={handleApplyPreset}
            onSave={handleSavePreset}
            onDelete={handleDeletePreset}
          />

          <div className="round-configuration">
            <div className="round-config-group">
              <h3>DURAÇÃO DO ROUND</h3>
              <div className="timer-configuration">
                <label>
                  MINUTOS
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={roundMinutes}
                    disabled={roundSessionInProgress}
                    onChange={(event) =>
                      setRoundMinutes(Math.max(0, Number(event.target.value)))
                    }
                  />
                </label>

                <label>
                  SEGUNDOS
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={roundSeconds}
                    disabled={roundSessionInProgress}
                    onChange={(event) =>
                      setRoundSeconds(
                        Math.min(59, Math.max(0, Number(event.target.value))),
                      )
                    }
                  />
                </label>
              </div>
            </div>

            <div className="round-config-group">
              <h3>QUANTIDADE DE ROUNDS</h3>
              <input
                className="round-count-input"
                type="number"
                min="1"
                max="99"
                value={totalRounds}
                disabled={roundSessionInProgress}
                onChange={(event) =>
                  setTotalRounds(
                    Math.max(1, Math.min(99, Number(event.target.value))),
                  )
                }
              />
            </div>

            <div className="round-config-group">
              <h3>INTERVALO DE DESCANSO</h3>
              <div className="timer-configuration">
                <label>
                  MINUTOS
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={restMinutes}
                    disabled={roundSessionInProgress}
                    onChange={(event) =>
                      setRestMinutes(Math.max(0, Number(event.target.value)))
                    }
                  />
                </label>

                <label>
                  SEGUNDOS
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={restSeconds}
                    disabled={roundSessionInProgress}
                    onChange={(event) =>
                      setRestSeconds(
                        Math.min(59, Math.max(0, Number(event.target.value))),
                      )
                    }
                  />
                </label>
              </div>
            </div>

            <label className="round-final-rest">
              <input
                type="checkbox"
                checked={restAfterLastRound}
                disabled={roundSessionInProgress}
                onChange={(event) =>
                  setRestAfterLastRound(event.target.checked)
                }
              />
              INCLUIR DESCANSO APÓS O ÚLTIMO ROUND
            </label>
          </div>

          {roundConfig.roundDurationMs <= 0 && (
            <p className="round-validation">
              Configure uma duração válida para o round.
            </p>
          )}

          {roundConfig.roundDurationMs > 0 && (
            <RoundTimerPanel
              key={roundConfigKey}
              config={roundConfig}
              onStatusChange={handleRoundStatusChange}
              audioEnabled={audioPreferences.enabled}
              audioAlerts={audioPreferences.alerts}
            />
          )}
        </>
      )}

      <AudioSettings
        preferences={audioPreferences}
        onChange={setAudioPreferences}
      />
    </section>
  )
}
