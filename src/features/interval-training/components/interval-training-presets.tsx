
import { useState } from 'react'

import {
  deleteCustomPreset,
  getAllPresets,
  saveCustomPreset,
} from '../services/interval-training-presets'

import type { IntervalTrainingConfig } from '../types/interval-training'
import type { IntervalTrainingPreset } from '../types/interval-training-preset'

interface IntervalTrainingPresetsProps {
  config: IntervalTrainingConfig
  disabled: boolean
  isDirty: boolean
  onLoad: (config: IntervalTrainingConfig, presetId: string) => void
  onSave: (presetId: string | null) => void
}

export function IntervalTrainingPresets({
  config,
  disabled,
  isDirty,
  onLoad,
  onSave,
}: IntervalTrainingPresetsProps) {
  const [presets, setPresets] = useState(getAllPresets)
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(
    null,
  )
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [feedback, setFeedback] = useState('')

  const builtInPresets = presets.filter((preset) => preset.isBuiltIn)
  const customPresets = presets.filter((preset) => !preset.isBuiltIn)

  function refreshPresets() {
    setPresets(getAllPresets())
  }

  function handleLoad(preset: IntervalTrainingPreset): boolean {
    if (disabled) {
      return false
    }

    if (
      isDirty &&
      !window.confirm(
        'Existem alterações na configuração atual. Deseja descartá-las e carregar este modelo?',
      )
    ) {
      return false
    }

    const independentConfig = JSON.parse(
      JSON.stringify(preset.config),
    ) as IntervalTrainingConfig

    onLoad(independentConfig, preset.id)

    setSelectedPresetId(preset.id)
    setFeedback(`Modelo "${preset.name}" carregado.`)

    return true
  }

  function handleOpenNew() {
    setSelectedPresetId(null)
    setName('')
    setDescription('')
    setShowEditor(true)
    setFeedback('')
  }

  function handleOpenEdit(preset: IntervalTrainingPreset) {
    if (preset.isBuiltIn || disabled) {
      return
    }

    if (!handleLoad(preset)) {
      return
    }

    setName(preset.name)
    setDescription(preset.description)
    setShowEditor(true)
    setFeedback('')
  }

  function handleSave() {
    if (!name.trim() || disabled) {
      return
    }

    const saved = saveCustomPreset({
      id: selectedPresetId ?? undefined,
      name: name.trim(),
      description: description.trim(),
      config,
    })

    if (!saved) {
      setFeedback('Não foi possível salvar o modelo.')
      return
    }

    refreshPresets()
    setSelectedPresetId(saved.id)
    setShowEditor(false)
    onSave(saved.id)
    setFeedback(`Modelo "${saved.name}" salvo.`)
  }

  function handleDelete(preset: IntervalTrainingPreset) {
    if (preset.isBuiltIn || disabled) {
      return
    }

    if (!window.confirm(`Deseja excluir o modelo "${preset.name}"?`)) {
      return
    }

    const deleted = deleteCustomPreset(preset.id)

    if (!deleted) {
      setFeedback('Não foi possível excluir o modelo.')
      return
    }

    if (selectedPresetId === preset.id) {
      setSelectedPresetId(null)
      setShowEditor(false)
    }

    refreshPresets()
    setFeedback(`Modelo "${preset.name}" excluído.`)
  }

  function renderPreset(preset: IntervalTrainingPreset) {
    const isSelected = selectedPresetId === preset.id

    return (
      <article
        className={`interval-preset-card${isSelected ? ' selected' : ''}`}
        key={preset.id}
      >
        <div className="interval-preset-info">
          <div className="interval-preset-title">
            <strong>{preset.name}</strong>

            <span className={preset.isBuiltIn ? 'native' : 'custom'}>
              {preset.isBuiltIn ? 'NATIVO' : 'PERSONALIZADO'}
            </span>
          </div>

          <p>{preset.description}</p>

          <span className="interval-preset-format">
            {preset.config.workout.type === 'repeated'
              ? 'INTERVALOS REPETIDOS'
              : 'SEQUÊNCIA DE EXERCÍCIOS'}
          </span>
        </div>

        <div className="interval-preset-actions">
          <button
            type="button"
            className="interval-button primary"
            disabled={disabled}
            onClick={() => handleLoad(preset)}
          >
            CARREGAR
          </button>

          {!preset.isBuiltIn && (
            <>
              <button
                type="button"
                className="interval-button secondary"
                disabled={disabled}
                onClick={() => handleOpenEdit(preset)}
              >
                EDITAR
              </button>

              <button
                type="button"
                className="interval-button danger"
                disabled={disabled}
                onClick={() => handleDelete(preset)}
              >
                EXCLUIR
              </button>
            </>
          )}
        </div>
      </article>
    )
  }

  return (
    <section
      className="interval-presets"
      aria-label="Modelos de treino"
    >
      <div className="interval-presets-heading">
        <div>
          <span className="interval-eyebrow">BIBLIOTECA</span>
          <h3>Modelos de Treino</h3>
          <p>Carregue um modelo ou salve sua configuração atual.</p>
        </div>

        <button
          type="button"
          className="interval-button primary"
          disabled={disabled}
          onClick={handleOpenNew}
        >
          SALVAR COMO MODELO
        </button>
      </div>

      {showEditor && (
        <div className="interval-preset-editor">
          <h4>
            {selectedPresetId
              ? 'Editar modelo personalizado'
              : 'Novo modelo personalizado'}
          </h4>

          <div className="interval-config-field">
            <label htmlFor="interval-preset-name">NOME DO MODELO</label>
            <input
              id="interval-preset-name"
              type="text"
              maxLength={80}
              value={name}
              disabled={disabled}
              placeholder="Ex.: Meu treino de condicionamento"
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="interval-config-field">
            <label htmlFor="interval-preset-description">
              DESCRIÇÃO
            </label>
            <textarea
              id="interval-preset-description"
              maxLength={200}
              value={description}
              disabled={disabled}
              placeholder="Descreva o objetivo do treino."
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <p>
            A configuração atual do treino será armazenada neste modelo.
          </p>

          <div className="interval-preset-editor-actions">
            <button
              type="button"
              className="interval-button primary"
              disabled={disabled || !name.trim()}
              onClick={handleSave}
            >
              SALVAR MODELO
            </button>

            <button
              type="button"
              className="interval-button secondary"
              onClick={() => setShowEditor(false)}
            >
              CANCELAR
            </button>
          </div>
        </div>
      )}

      <div className="interval-presets-group">
        <h4>MODELOS NATIVOS</h4>
        {builtInPresets.map(renderPreset)}
      </div>

      <div className="interval-presets-group">
        <h4>MEUS MODELOS</h4>

        {customPresets.length === 0 ? (
          <p className="interval-presets-empty">
            Você ainda não possui modelos personalizados.
          </p>
        ) : (
          customPresets.map(renderPreset)
        )}
      </div>

      {feedback && (
        <p className="interval-presets-feedback" role="status">
          {feedback}
        </p>
      )}
    </section>
  )
}
