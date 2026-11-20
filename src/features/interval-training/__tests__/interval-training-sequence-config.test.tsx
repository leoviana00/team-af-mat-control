
 // @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react'

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { IntervalTrainingSequenceConfig } from '../components/interval-training-sequence-config'

import type { ExerciseSequenceConfig } from '../types/interval-training'

const initialConfig: ExerciseSequenceConfig = {
  type: 'sequence',
  exercises: [
    {
      id: 'flexao',
      name: 'Flexão de braço',
      durationSeconds: 30,
      restDurationSeconds: 15,
    },
    {
      id: 'agachamento',
      name: 'Agachamento',
      durationSeconds: 20,
      restDurationSeconds: 10,
    },
  ],
  loops: 3,
  restAfterLastActivity: false,
}

describe('IntervalTrainingSequenceConfig', () => {
  const onChange = vi.fn()

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    onChange.mockClear()
  })

  function renderComponent(
    config = initialConfig,
    disabled = false,
  ) {
    return render(
      <IntervalTrainingSequenceConfig
        config={config}
        disabled={disabled}
        onChange={onChange}
      />,
    )
  }

  it('should render the configured exercises and loops', () => {
    renderComponent()

    expect(screen.getByText('Flexão de braço')).toBeTruthy()
    expect(screen.getByText('Agachamento')).toBeTruthy()

    expect(
      screen.getByLabelText('QUANTIDADE DE VOLTAS'),
    ).toHaveProperty('value', '3')
  })

  it('should add a new exercise', () => {
    const exerciseId = '00000000-0000-4000-8000-000000000001'

    vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValue(exerciseId)

    renderComponent()

    fireEvent.change(
      screen.getByLabelText('NOME DO EXERCÍCIO'),
      {
        target: { value: 'Burpees' },
      },
    )

    fireEvent.change(
      screen.getByLabelText('TEMPO DE ATIVIDADE'),
      {
        target: { value: '25' },
      },
    )

    fireEvent.change(
      screen.getByLabelText(
        'TEMPO DE DESCANSO APÓS O EXERCÍCIO',
      ),
      {
        target: { value: '10' },
      },
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'ADICIONAR EXERCÍCIO',
      }),
    )

    expect(onChange).toHaveBeenCalledWith({
      ...initialConfig,
      exercises: [
        ...initialConfig.exercises,
        {
          id: exerciseId,
          name: 'Burpees',
          durationSeconds: 25,
          restDurationSeconds: 10,
        },
      ],
    })
  })

  it('should edit an existing exercise', () => {
    renderComponent()

    fireEvent.click(
      screen.getAllByRole('button', {
        name: 'EDITAR',
      })[0],
    )

    fireEvent.change(
      screen.getByLabelText('NOME DO EXERCÍCIO'),
      {
        target: { value: 'Flexão explosiva' },
      },
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'SALVAR ALTERAÇÕES',
      }),
    )

    expect(onChange).toHaveBeenCalledWith({
      ...initialConfig,
      exercises: [
        {
          ...initialConfig.exercises[0],
          name: 'Flexão explosiva',
        },
        initialConfig.exercises[1],
      ],
    })
  })

  it('should remove an exercise', () => {
    renderComponent()

    fireEvent.click(
      screen.getAllByRole('button', {
        name: 'EXCLUIR',
      })[0],
    )

    expect(onChange).toHaveBeenCalledWith({
      ...initialConfig,
      exercises: [initialConfig.exercises[1]],
    })
  })

  it('should move an exercise down', () => {
    renderComponent()

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Mover Flexão de braço para baixo',
      }),
    )

    expect(onChange).toHaveBeenCalledWith({
      ...initialConfig,
      exercises: [
        initialConfig.exercises[1],
        initialConfig.exercises[0],
      ],
    })
  })

  it('should update the number of loops', () => {
    renderComponent()

    fireEvent.change(
      screen.getByLabelText('QUANTIDADE DE VOLTAS'),
      {
        target: { value: '5' },
      },
    )

    expect(onChange).toHaveBeenCalledWith({
      ...initialConfig,
      loops: 5,
    })
  })

  it('should update the final rest option', () => {
    renderComponent()

    fireEvent.click(
      screen.getByLabelText(
        'Incluir descanso após a última atividade da última volta',
      ),
    )

    expect(onChange).toHaveBeenCalledWith({
      ...initialConfig,
      restAfterLastActivity: true,
    })
  })

  it('should disable editing controls during a session', () => {
    renderComponent(initialConfig, true)

    expect(
      screen.getByLabelText('QUANTIDADE DE VOLTAS'),
    ).toHaveProperty('disabled', true)

    expect(
      screen.getByRole('button', {
        name: 'ADICIONAR EXERCÍCIO',
      }),
    ).toHaveProperty('disabled', true)

    expect(
      screen.getAllByRole('button', {
        name: 'EDITAR',
      })[0],
    ).toHaveProperty('disabled', true)

    expect(onChange).not.toHaveBeenCalled()
  })

  it('should not allow adding an exercise without a name', () => {
    renderComponent()

    expect(
      screen.getByRole('button', {
        name: 'ADICIONAR EXERCÍCIO',
      }),
    ).toHaveProperty('disabled', true)

    expect(onChange).not.toHaveBeenCalled()
  })
})
