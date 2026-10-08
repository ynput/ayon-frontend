import { createContext, useContext } from 'react'

export type RestartRequiredOptions = {
  callback?: () => void
}

export type RestartContextValue = {
  restartRequired: (options?: RestartRequiredOptions) => Promise<void>
  confirmRestart: () => void
  snoozeRestart: () => void
  isRestartRequired?: boolean
  isSnoozing: boolean | string | null | undefined
}

export const RestartContext = createContext<RestartContextValue | undefined>(undefined)

export const useRestart = (): RestartContextValue => useContext(RestartContext)!
