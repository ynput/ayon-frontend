import { FC, ReactNode, createContext, useContext } from 'react'
import { useLoadModule } from '@shared/hooks'
import { SubtasksManagerProps } from '@shared/components'

const SubtasksManagerFallback: FC<SubtasksManagerProps> = () => null

interface SubtasksModulesContextType {
  SubtasksManager: typeof SubtasksManagerFallback
  requiredVersion: string | undefined
  isLoading: boolean
}

const SubtasksModulesContext = createContext<SubtasksModulesContextType | undefined>(undefined)

export const SubtasksModulesProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [SubtasksManager, { outdated, isLoading }] = useLoadModule({
    addon: 'planner',
    remote: 'planner',
    module: 'SubtasksManager',
    fallback: SubtasksManagerFallback,
  })

  return (
    <SubtasksModulesContext.Provider
      value={{ SubtasksManager, requiredVersion: outdated?.required, isLoading }}
    >
      {children}
    </SubtasksModulesContext.Provider>
  )
}

export const useSubtasksModulesContext = (): SubtasksModulesContextType => {
  const context = useContext(SubtasksModulesContext)
  if (!context) {
    throw new Error('useSubtasksModulesContext must be used within a SubtasksModulesProvider')
  }
  return context
}
