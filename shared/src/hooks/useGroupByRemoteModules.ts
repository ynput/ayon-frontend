import { useLoadModule } from '@shared/hooks'
import { GroupSettingsFallback } from '../containers/ProjectTreeTable/components/GroupSettingsFallback'
import {
  getGroupQueries,
  type GetGroupQueriesParams,
  type GroupQuery,
} from '../containers/ProjectTreeTable/utils/getGroupQueries'
import { usePowerpack } from '@shared/context'

export type ProjectTableModulesType = {
  GroupSettings: typeof GroupSettingsFallback
  getGroupQueries: (params: GetGroupQueriesParams) => GroupQuery[]
  requiredVersion?: string
  isLoading: boolean
}

// getGroupQueries is community (shared, not license-gated) — see issue #2083.
// Only the advanced GroupSettings config UI stays a powerpack remote.
export const useGroupByRemoteModules = (): ProjectTableModulesType => {
  const { powerLicense } = usePowerpack()

  const [GroupSettings, { outdated, isLoading }] = useLoadModule({
    addon: 'powerpack',
    remote: 'slicer',
    module: 'GroupSettings',
    fallback: GroupSettingsFallback,
    minVersion: '1.1.1-dev',
    skip: !powerLicense, // skip loading if powerpack license is not available
  })

  return {
    GroupSettings,
    getGroupQueries,
    requiredVersion: outdated?.required,
    isLoading,
  }
}
