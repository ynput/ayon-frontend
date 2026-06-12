// a hook that checks if an addon is in the production bundle
import { useCallback } from 'react'
import { useListAddonsQuery } from '@shared/api'
import type { AddonListItem } from '@shared/api'
import semver from 'semver'

export const useGetProductionAddon = () => {
  const { data, isLoading, isError } = useListAddonsQuery({})

  const getProductionAddon = useCallback(
    (
      addonName: string,
      options?: { version?: string; minVersion?: string },
    ): AddonListItem | undefined => {
      if (!data?.addons) return undefined

      const addon = data.addons.find((a) => a.name === addonName)
      const productionVersion = addon?.productionVersion

      if (!addon || !productionVersion) return undefined

      if (options?.version && productionVersion !== options.version) {
        return undefined
      }

      if (options?.minVersion) {
        try {
          const isCompatible =
            semver.gte(productionVersion, options.minVersion) ||
            semver.gte(semver.coerce(productionVersion) || '0.0.0', options.minVersion)
          if (!isCompatible) return undefined
        } catch (e) {
          return undefined
        }
      }

      return addon
    },
    [data],
  )

  return {
    getProductionAddon,
    isLoading,
    isError,
  }
}

export default useGetProductionAddon
