import { useLoadModule } from '@shared/hooks'
import { GroupSettingsFallback } from '../components/GroupSettingsFallback'
import { EntityGroup, QueryFilter } from '@shared/api'
import { TableGroupBy } from '../context'
import { usePowerpack } from '@shared/context'

type GetGroupQueriesParams = {
  taskGroups: EntityGroup[]
  filters: QueryFilter | undefined
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
  const { powerLicense } = usePowerpack()

  const minVersion = '1.1.1-dev'
  const [GroupSettings, { outdated, isLoading: isLoadingSettings }] = useLoadModule({
    addon: 'powerpack',
    remote: 'slicer',
    module: 'GroupSettings',
    fallback: GroupSettingsFallback,
    minVersion: minVersion,
    skip: !powerLicense, // skip loading if powerpack license is not available
  })

  const [getGroupQueries, { isLoading: isLoadingQueries }] = useLoadModule({
    addon: 'powerpack',
    remote: 'slicer',
    module: 'getGroupQueries',
    fallback: getGroupQueriesFallback,
    minVersion: minVersion,
    skip: !powerLicense, // skip loading if powerpack license is not available
  })

  const isLoading = isLoadingSettings || isLoadingQueries

  return {
    GroupSettings,
    getGroupQueries,
    requiredVersion: outdated?.required,
    isLoading: isLoading,
  }
}
