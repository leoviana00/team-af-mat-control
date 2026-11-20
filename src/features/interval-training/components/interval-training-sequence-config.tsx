
import { useState } from 'react'

import type {
  ExerciseSequenceConfig,
  SequenceExercise,
} from '../types/interval-training'

interface IntervalTrainingSequenceConfigProps {
  config: ExerciseSequenceConfig
  disabled: boolean
  onChange: (config: ExerciseSequenceConfig) => void
}

const EMPTY_EXERCISE = {
  name: '',
  durationSeconds: 30,
  restDurationSeconds: 15,
}

export function IntervalTrainingSequenceConfig({
  config,
  disabled,
  onChange,
}: IntervalTrainingSequenceConfigProps) {
  const [exerciseDraft, setExerciseDraft] = useState(EMPTY_EXERCISE)
  const [editingId, setEditingId] = useState<string | null>(null)

  function updateConfig(changes: Partial<ExerciseSequenceConfig>) {
    onChange({
      ...config,
      ...changes,
    })
  }

  function updateExercise(
    exerciseId: string,
    changes: Partial<SequenceExercise>,
  ) {
    updateConfig({
      exercises: config.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? { ...exercise, ...changes }
          : exercise,
      ),
    })
  }

  function resetDraft() {
    setExerciseDraft(EMPTY_EXERCISE)
    setEditingId(null)
  }

  function handleSaveExercise() {
    const name = exerciseDraft.name.trim()

    if (!name || disabled) {
      return
    }

    if (editingId) {
      updateExercise(editingId, {
        name,
        durationSeconds: exerciseDraft.durationSeconds,
        restDurationSeconds: exerciseDraft.restDurationSeconds,
      })
    } else {
      const exercise: SequenceExercise = {
        id: crypto.randomUUID(),
        name,
        durationSeconds: exerciseDraft.durationSeconds,
        restDurationSeconds: exerciseDraft.restDurationSeconds,
      }

      updateConfig({
        exercises: [...config.exercises, exercise],
      })
    }

    resetDraft()
  }

  function handleEditExercise(exercise: SequenceExercise) {
    setExerciseDraft({
      name: exercise.name,
      durationSeconds: exercise.durationSeconds,
      restDurationSeconds: exercise.restDurationSeconds,
    })

    setEditingId(exercise.id)
  }

  function handleRemoveExercise(exerciseId: string) {
    if (disabled) {
      return
    }

    updateConfig({
      exercises: config.exercises.filter(
        (exercise) => exercise.id !== exerciseId,
      ),
    })

    if (editingId === exerciseId) {
      resetDraft()
    }
  }

  function handleMoveExercise(
    exerciseId: string,
    direction: -1 | 1,
  ) {
    if (disabled) {
      return
    }

    const currentIndex = config.exercises.findIndex(
      (exercise) => exercise.id === exerciseId,
    )

    const targetIndex = currentIndex + direction

    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= config.exercises.length
    ) {
      return
    }

    const exercises = [...config.exercises]

    const [exercise] = exercises.splice(currentIndex, 1)
    exercises.splice(targetIndex, 0, exercise)

    updateConfig({ exercises })
  }

  function updateDraftNumber(
    field: 'durationSeconds' | 'restDurationSeconds',
    value: string,
  ) {
    const parsedValue = Number(value)

    const normalizedValue = Number.isFinite(parsedValue)
      ? Math.min(3600, Math.max(0, Math.floor(parsedValue)))
      : 0

    setExerciseDraft((current) => ({
      ...current,
      [field]: normalizedValue,
    }))
  }

  const totalActivities = config.exercises.length * config.loops

  const totalDurationSeconds = config.exercises.reduce(
    (total, exercise) =>
      total +
      exercise.durationSeconds +
      exercise.restDurationSeconds,
    0,
  ) * config.loops

  return (
    <section
      className="interval-config interval-sequence-config"
      aria-label="Configuração da sequência de exercícios"
    >
      <div className="interval-config-heading">
        <span className="interval-eyebrow">CONFIGURAÇÃO</span>
        <h3>Sequência de exercícios</h3>
        <p>
          Monte seu circuito, defina os tempos e organize as voltas.
        </p>
      </div>

      <div className="interval-config-field">
        <label htmlFor="interval-sequence-loops">
          QUANTIDADE DE VOLTAS
        </label>

        <div className="interval-input-wrapper">
          <input
            id="interval-sequence-loops"
            type="number"
            min="1"
            max="99"
            value={config.loops}
            disabled={disabled}
            onChange={(event) =>
              updateConfig({
                loops: Math.min(
                  99,
                  Math.max(1, Number(event.target.value) || 1),
                ),
              })
            }
          />
          <span>VOLTAS</span>
        </div>
      </div>

      <div className="interval-sequence-list">
        <div className="interval-sequence-list-heading">
          <h4>EXERCÍCIOS DO CIRCUITO</h4>
          <span>{config.exercises.length} exercícios</span>
        </div>

        {config.exercises.length === 0 && (
          <p className="interval-sequence-empty">
            Nenhum exercício cadastrado. Adicione o primeiro exercício
            abaixo.
          </p>
        )}

        {config.exercises.map((exercise, index) => (
          <article
            className="interval-sequence-exercise"
            key={exercise.id}
          >
            <div className="interval-sequence-exercise-info">
              <span className="interval-sequence-number">
                {String(index + 1).padStart(2, '0')}
              </span>

              <div>
                <strong>{exercise.name}</strong>
                <p>
                  {exercise.durationSeconds}s de atividade
                  {' · '}
                  {exercise.restDurationSeconds}s de descanso
                </p>
              </div>
            </div>

            <div className="interval-sequence-actions">
              <button
                type="button"
                disabled={disabled || index === 0}
                onClick={() => handleMoveExercise(exercise.id, -1)}
                aria-label={`Mover ${exercise.name} para cima`}
                title="Mover para cima"
              >
                ↑
              </button>

              <button
                type="button"
                disabled={
                  disabled || index === config.exercises.length - 1
                }
                onClick={() => handleMoveExercise(exercise.id, 1)}
                aria-label={`Mover ${exercise.name} para baixo`}
                title="Mover para baixo"
              >
                ↓
              </button>

              <button
                type="button"
                disabled={disabled}
                onClick={() => handleEditExercise(exercise)}
              >
                EDITAR
              </button>

              <button
                type="button"
                className="danger"
                disabled={disabled}
                onClick={() => handleRemoveExercise(exercise.id)}
              >
                EXCLUIR
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="interval-sequence-editor">
        <div className="interval-config-heading">
          <span className="interval-eyebrow">
            {editingId ? 'EDIÇÃO' : 'NOVO EXERCÍCIO'}
          </span>

          <h4>
            {editingId ? 'Editar exercício' : 'Adicionar exercício'}
          </h4>
        </div>

        <div className="interval-config-field">
          <label htmlFor="interval-exercise-name">
            NOME DO EXERCÍCIO
          </label>

          <input
            id="interval-exercise-name"
            type="text"
            maxLength={50}
            placeholder="Ex.: Flexão de braço"
            value={exerciseDraft.name}
            disabled={disabled}
            onChange={(event) =>
              setExerciseDraft((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
          />
        </div>

        <div className="interval-config-field">
          <label htmlFor="interval-exercise-duration">
            TEMPO DE ATIVIDADE
          </label>

          <div className="interval-input-wrapper">
            <input
              id="interval-exercise-duration"
              type="number"
              min="1"
              max="3600"
              value={exerciseDraft.durationSeconds}
              disabled={disabled}
              onChange={(event) =>
                updateDraftNumber(
                  'durationSeconds',
                  event.target.value,
                )
              }
            />
            <span>SEGUNDOS</span>
          </div>
        </div>

        <div className="interval-config-field">
          <label htmlFor="interval-exercise-rest">
            TEMPO DE DESCANSO APÓS O EXERCÍCIO
          </label>

          <div className="interval-input-wrapper">
            <input
              id="interval-exercise-rest"
              type="number"
              min="0"
              max="3600"
              value={exerciseDraft.restDurationSeconds}
              disabled={disabled}
              onChange={(event) =>
                updateDraftNumber(
                  'restDurationSeconds',
                  event.target.value,
                )
              }
            />
            <span>SEGUNDOS</span>
          </div>
        </div>

        <div className="interval-sequence-editor-actions">
          <button
            type="button"
            className="interval-button primary"
            disabled={
              disabled ||
              !exerciseDraft.name.trim() ||
              exerciseDraft.durationSeconds < 1
            }
            onClick={handleSaveExercise}
          >
            {editingId ? 'SALVAR ALTERAÇÕES' : 'ADICIONAR EXERCÍCIO'}
          </button>

          {editingId && (
            <button
              type="button"
              className="interval-button secondary"
              disabled={disabled}
              onClick={resetDraft}
            >
              CANCELAR EDIÇÃO
            </button>
          )}
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

        <span>
          Incluir descanso após a última atividade da última volta
        </span>
      </label>

      <div className="interval-config-summary">
        <span>RESUMO DO CIRCUITO</span>
        <strong>
          {totalActivities} atividades em {config.loops} voltas
        </strong>
        <p>
          {config.exercises.length} exercícios diferentes
          {' · '}
          {Math.floor(totalDurationSeconds / 60)} min
          {' '}
          {totalDurationSeconds % 60}s estimados
        </p>
      </div>
    </section>
  )
}
