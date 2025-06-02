import { useLoadModule } from '@shared/hooks'
import React, { createContext, useContext, ReactNode, FC, useMemo } from 'react'
import { GroupSettingsFallback } from '../components/GroupSettingsFallback'
import { EntityGroup } from '@shared/api'
import { Filter } from '@ynput/ayon-react-components'
import { TableGroupBy } from './ColumnSettingsContext'

type GetGroupQueriesParams = {
  taskGroups: EntityGroup[]
  filters: Filter[]
  groupBy: TableGroupBy
  groupPageCounts: Record<string, number>
}

type GetGroupQueriesReturn = {
  value: any
  count: number
  filter: string
}[]

const getGroupQueriesFallback = (params: GetGroupQueriesParams): GetGroupQueriesReturn => []

interface ProjectTableModuleContextType {
  GroupSettings: typeof GroupSettingsFallback
  getGroupQueries?: (params: GetGroupQueriesParams) => GetGroupQueriesReturn
  requiredVersion?: string
  isLoading: boolean
}

const ProjectTableModuleContext = createContext<ProjectTableModuleContextType | undefined>(
  undefined,
)

interface ProjectTableModuleProviderProps {
  children: ReactNode
}

export const ProjectTableModuleProvider: React.FC<ProjectTableModuleProviderProps> = ({
  children,
}) => {
  const minVersion = '1.0.6-dev'
  const [GroupSettings, { outdated, isLoading: isLoadingSettings }] = useLoadModule({
    addon: 'powerpack',
    remote: 'slicer',
    module: 'GroupSettings',
    fallback: GroupSettingsFallback,
    minVersion: minVersion,
  })

  const [getGroupQueries, { isLoading: isLoadingQueries }] = useLoadModule({
    addon: 'powerpack',
    remote: 'slicer',
    module: 'getGroupQueries',
    fallback: getGroupQueriesFallback,
    minVersion: minVersion,
  })

  const value = useMemo(
    () => ({
      GroupSettings,
      getGroupQueries,
      requiredVersion: outdated?.required,
      isLoading: isLoadingSettings || isLoadingQueries,
    }),
    [GroupSettings, getGroupQueries, outdated?.required],
  )

  return (
    <ProjectTableModuleContext.Provider value={value}>
      {children}
    </ProjectTableModuleContext.Provider>
  )
}

export const useProjectTableModuleContext = (): ProjectTableModuleContextType => {
  const context = useContext(ProjectTableModuleContext)
  if (context === undefined) {
    throw new Error('useProjectTableModuleContext must be used within a ProjectTableModuleProvider')
  }
  return context
}
