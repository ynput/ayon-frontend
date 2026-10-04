import { FC, ReactNode, useEffect } from 'react'
import { useLoadModule } from '@shared/hooks/useLoadModule'
import type { SubtasksManagerProps } from '@shared/components/SubtasksManager/SubtasksManagerWrapper'
import { usePowerpack } from './PowerpackContextInstance'
import { SubtasksModulesContext } from './SubtasksModulesContextInstance'

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

export interface SubtasksModulesContextType {
  SubtasksManager: typeof SubtasksManagerFallback
  requiredVersion: string | undefined
  isLoading: boolean
}

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
