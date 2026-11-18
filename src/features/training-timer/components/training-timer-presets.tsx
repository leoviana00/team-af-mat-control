import { useState } from 'react'
import type {
  CustomTrainingTimerPreset,
  TimerPresetConfig,
  TrainingTimerPreset,
} from '../types/training-timer-preset'

interface TrainingTimerPresetsProps {
  presets: TrainingTimerPreset[]
  selectedPresetId: string
  currentConfig: TimerPresetConfig
  disabled: boolean
  onSelect: (presetId: string) => void
  onApply: (preset: TrainingTimerPreset) => void
  onSave: (
    name: string,
    description: string,
    config: TimerPresetConfig,
    id?: string,
  ) => CustomTrainingTimerPreset | null
  onDelete: (id: string) => boolean
}

export function TrainingTimerPresets({
  presets,
  selectedPresetId,
  currentConfig,
  disabled,
  onSelect,
  onApply,
  onSave,
  onDelete,
}: TrainingTimerPresetsProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const selectedPreset = presets.find(
    (preset) => preset.id === selectedPresetId,
  )

  const selectedCustomPreset =
    selectedPreset && !selectedPreset.isBuiltIn ? selectedPreset : null

  function handlePresetSelection(presetId: string) {
    const preset = presets.find((item) => item.id === presetId)

    onSelect(presetId)

    if (preset && !preset.isBuiltIn) {
      setName(preset.name)
      setDescription(preset.description)
    } else {
      setName('')
      setDescription('')
    }
  }

  function handleSave() {
    const normalizedName = name.trim()

    if (!normalizedName || disabled) {
      return
    }

    onSave(
      normalizedName,
      description.trim(),
      currentConfig,
      selectedCustomPreset?.id,
    )
  }

  function handleDelete() {
    if (!selectedCustomPreset || disabled) {
      return
    }

    const confirmed = window.confirm(
      `Deseja realmente excluir o modelo "${selectedCustomPreset.name}"?`,
    )

    if (confirmed && onDelete(selectedCustomPreset.id)) {
      onSelect('')
      setName('')
      setDescription('')
    }
  }

  return (
    <section className="timer-presets" aria-label="Modelos de treino">
      <div className="timer-presets-header">
        <h3>MODELOS DE TREINO</h3>
        <span>CONFIGURAÇÕES SALVAS</span>
      </div>

      <div className="timer-presets-selector">
        <select
          value={selectedPresetId}
          disabled={disabled}
          onChange={(event) => handlePresetSelection(event.target.value)}
          aria-label="Selecionar modelo de treino"
        >
          <option value="">Selecione um modelo</option>

          <optgroup label="MODELOS PADRÃO">
            {presets
              .filter((preset) => preset.isBuiltIn)
              .map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
          </optgroup>

          <optgroup label="MEUS MODELOS">
            {presets
              .filter((preset) => !preset.isBuiltIn)
              .map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
          </optgroup>
        </select>

        <button
          type="button"
          className="preset-apply-button"
          disabled={disabled || !selectedPreset}
          onClick={() => selectedPreset && onApply(selectedPreset)}
        >
          APLICAR
        </button>
      </div>

      {selectedPreset && (
        <p className="timer-preset-description">
          {selectedPreset.description}
        </p>
      )}

      <div className="timer-preset-editor">
        <h4>
          {selectedCustomPreset
            ? 'EDITAR MODELO PERSONALIZADO'
            : 'SALVAR CONFIGURAÇÃO ATUAL'}
        </h4>

        <label>
          NOME
          <input
            type="text"
            maxLength={40}
            value={name}
            disabled={disabled}
            placeholder="Ex.: Treino de competição"
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <label>
          DESCRIÇÃO
          <input
            type="text"
            maxLength={100}
            value={description}
            disabled={disabled}
            placeholder="Descreva a configuração"
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>

        <div className="timer-preset-actions">
          <button
            type="button"
            className="preset-save-button"
            disabled={disabled || !name.trim()}
            onClick={handleSave}
          >
            {selectedCustomPreset ? 'ATUALIZAR MODELO' : 'SALVAR NOVO MODELO'}
          </button>

          {selectedCustomPreset && (
            <button
              type="button"
              className="preset-delete-button"
              disabled={disabled}
              onClick={handleDelete}
            >
              EXCLUIR
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
