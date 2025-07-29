import { useLoadModule } from '@shared/hooks'
import { GroupSettingsFallback } from '../components/GroupSettingsFallback'
import { EntityGroup, QueryFilter } from '@shared/api'
import { TableGroupBy } from '../context'

type GetGroupQueriesParams = {
  taskGroups: EntityGroup[]
  queryFilters: QueryFilter | undefined
  groupBy: TableGroupBy
  groupPageCounts: Record<string, number>
}

type GetGroupQueriesReturn = {
  value: any
  count: number
  filter: string
}[]

export type ProjectTableModulesType = {
  GroupSettings: typeof GroupSettingsFallback
  getGroupQueries?: (params: GetGroupQueriesParams) => GetGroupQueriesReturn
  requiredVersion?: string
  isLoading: boolean
}

const getGroupQueriesFallback = (params: GetGroupQueriesParams): GetGroupQueriesReturn => []

export const useProjectTableModules = (): ProjectTableModulesType => {
  const minVersion = '1.1.1-dev'
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

  const isLoading = isLoadingSettings || isLoadingQueries

  return {
    GroupSettings,
    getGroupQueries,
    requiredVersion: outdated?.required,
    isLoading: isLoading,
  }
}
