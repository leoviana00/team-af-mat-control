
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { createIntervalEngine } from '../engine/interval-engine'
import { createSequenceEngine } from '../engine/sequence-engine'

import type {
  IntervalTrainingConfig,
  IntervalTrainingEngine,
  IntervalTrainingEvent,
  IntervalTrainingSnapshot,
} from '../types/interval-training'

interface UseIntervalTrainingOptions {
  tickIntervalMs?: number
  onEvent?: (event: IntervalTrainingEvent) => void
}

interface SnapshotState {
  engine: IntervalTrainingEngine
  snapshot: IntervalTrainingSnapshot
}

export function useIntervalTraining(
  initialConfig: IntervalTrainingConfig,
  options: UseIntervalTrainingOptions = {},
) {
  const { tickIntervalMs, onEvent } = options

  const [config, setConfig] = useState(initialConfig)

  const [snapshotState, setSnapshotState] =
    useState<SnapshotState | null>(null)

  // Mantém o callback estável sem acessar refs durante a renderização.
  const handleEvent = useCallback(
    (event: IntervalTrainingEvent) => {
      onEvent?.(event)
    },
    [onEvent],
  )

  const engine = useMemo<IntervalTrainingEngine>(() => {
    let instance: IntervalTrainingEngine | null = null

    const engineOptions = {
      preparationDurationMs:
        config.preparationDurationSeconds * 1000,
      tickIntervalMs,

      onChange: (snapshot: IntervalTrainingSnapshot) => {
        if (instance) {
          setSnapshotState({
            engine: instance,
            snapshot,
          })
        }
      },

      onEvent: handleEvent,
    }

    if (config.workout.type === 'repeated') {
      instance = createIntervalEngine(
        config.workout,
        engineOptions,
      )
    } else {
      instance = createSequenceEngine(
        config.workout,
        engineOptions,
      )
    }

    return instance
  }, [config, tickIntervalMs, handleEvent])

  const snapshot =
    snapshotState?.engine === engine
      ? snapshotState.snapshot
      : engine.getSnapshot()

  // Interrompe o motor anterior quando a instância muda
  // ou quando o componente é desmontado.
  useEffect(() => {
    return () => {
      engine.pause()
    }
  }, [engine])

  const start = useCallback(() => {
    engine.start()
  }, [engine])

  const pause = useCallback(() => {
    engine.pause()
  }, [engine])

  const resume = useCallback(() => {
    engine.resume()
  }, [engine])

  const reset = useCallback(() => {
    engine.reset()
  }, [engine])

  const cancel = useCallback(() => {
    engine.cancel()
  }, [engine])

  // Configuração só pode ser alterada quando não há
  // uma sessão em preparação, execução ou pausa.
  const updateConfig = (
    nextConfig: IntervalTrainingConfig,
  ): boolean => {
    const currentStatus = engine.getSnapshot().status

    const canUpdateConfig =
      currentStatus === 'idle' ||
      currentStatus === 'completed' ||
      currentStatus === 'cancelled'

    if (!canUpdateConfig) {
      return false
    }

    setConfig(nextConfig)

    return true
  }

  const isConfigLocked =
    snapshot.status !== 'idle' &&
    snapshot.status !== 'completed' &&
    snapshot.status !== 'cancelled'

  return {
    config,
    snapshot,
    isConfigLocked,
    start,
    pause,
    resume,
    reset,
    cancel,
    updateConfig,
  }
}
