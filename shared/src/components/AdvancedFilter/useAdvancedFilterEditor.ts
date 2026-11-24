import { FC } from 'react'
import { usePowerpack } from '@shared/context'
import { useLoadModule } from '@shared/hooks/useLoadModule'
import type { AdvancedFilterProps } from '@shared/containers/ProjectTreeTable/utils/advancedFilter'
import { ADVANCED_FILTER_MIN_VERSION } from './AdvancedFilterSlotHelpers'

export type AdvancedFilterEditor = {
  // null while loading, without a license and when the module is not available
  Editor: FC<AdvancedFilterProps> | null
  powerLicense: boolean
  // the license or the module is still loading
  isLoading: boolean
  outdated?: { current: string; required: string }
}

// The editor of the advanced filter: the Power Pack module `AdvancedFilter` (remote `views`).
// One page loads it once and passes it to the controls that use it.
export const useAdvancedFilterEditor = ({ skip = false } = {}): AdvancedFilterEditor => {
  // loaded as soon as the license is known: the button is part of the toolbar, and a fixed
  // start up delay would hide it for seconds on every visit of the page
  const { powerLicense, isLoading: isLoadingLicense } = usePowerpack()

  const [AdvancedFilter, { isLoaded, isLoading, outdated }] =
    useLoadModule<FC<AdvancedFilterProps> | null>({
      addon: 'powerpack',
      remote: 'views',
      module: 'AdvancedFilter',
      fallback: null,
      minVersion: ADVANCED_FILTER_MIN_VERSION,
      skip: skip || !powerLicense,
    })

  return {
    Editor: isLoaded ? AdvancedFilter : null,
    powerLicense,
    isLoading: isLoadingLicense || (powerLicense && isLoading),
    outdated,
  }
}
