import type {
  IntervalAudioPreferences,
} from '../types/interval-audio-preferences'

interface IntervalAudioSettingsProps {
  preferences: IntervalAudioPreferences
  onChange: (preferences: IntervalAudioPreferences) => void
}

const AUDIO_OPTIONS: {
  key: Exclude<keyof IntervalAudioPreferences, 'enabled'>
  label: string
}[] = [
  {
    key: 'preparationCountdown',
    label: 'Contagem de preparação',
  },
  {
    key: 'activityStart',
    label: 'Início da atividade',
  },
  {
    key: 'finalCountdown',
    label: 'Últimos 5 segundos — atividade / descanso',
  },
  {
    key: 'activityEnd',
    label: 'Fim da atividade',
  },
  {
    key: 'restStart',
    label: 'Início do descanso',
  },
  {
    key: 'restEnd',
    label: 'Fim do descanso',
  },
  {
    key: 'sessionComplete',
    label: 'Finalização da sessão',
  },
  {
    key: 'sessionCancelled',
    label: 'Cancelamento da sessão',
  },
]

export function IntervalAudioSettings({
  preferences,
  onChange,
}: IntervalAudioSettingsProps) {
  function handleMasterToggle(checked: boolean) {
    onChange({
      ...preferences,
      enabled: checked,
    })
  }

  function handleToggle(
    key: Exclude<keyof IntervalAudioPreferences, 'enabled'>,
    checked: boolean,
  ) {
    onChange({
      ...preferences,
      [key]: checked,
    })
  }

  return (
    <details className="timer-audio-settings">
      <summary>
        <span>CONFIGURAÇÕES DE ÁUDIO</span>

        <span
          className={`audio-indicator ${
            preferences.enabled ? 'active' : ''
          }`}
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
              handleMasterToggle(event.target.checked)
            }
          />
        </label>

        <div className="audio-settings-divider" />

        {AUDIO_OPTIONS.map((option) => (
          <label
            className="audio-setting"
            key={option.key}
          >
            <span>{option.label}</span>

            <input
              type="checkbox"
              checked={preferences[option.key]}
              disabled={!preferences.enabled}
              onChange={(event) =>
                handleToggle(option.key, event.target.checked)
              }
            />
          </label>
        ))}
      </div>
    </details>
  )
}