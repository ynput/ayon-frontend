import { useLoadModule } from '@shared/hooks'
import { GroupSettingsFallback } from '../containers/ProjectTreeTable/components/GroupSettingsFallback'
import { usePowerpack } from '@shared/context'

export type ProjectTableModulesType = {
  GroupSettings: typeof GroupSettingsFallback
  requiredVersion?: string
  isLoading: boolean
}

// getGroupQueries is community (not license-gated, #2083); only GroupSettings stays powerpack
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
    requiredVersion: outdated?.required,
    isLoading,
  }
}
