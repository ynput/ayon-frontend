import { FC, ReactNode, createContext, useContext, useEffect } from 'react'
import { useLoadModule } from '@shared/hooks'
import { SubtasksManagerProps } from '@shared/components'
import { usePowerpack } from './PowerpackContext'

const SubtasksManagerFallback: FC<SubtasksManagerProps> = (props) => {
  const { setPowerpackDialog } = usePowerpack()
  // open planner addon dialog
  useEffect(() => {
    setPowerpackDialog({ addon: 'planner', feature: 'subtasks' })
    // callback for when the module is not found, allowing parent components to handle this case (e.g. by hiding subtasks-related UI)
    props?.onNotFound?.()
  }, [setPowerpackDialog, props.onNotFound])

  return null
}

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
