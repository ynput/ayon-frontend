import { useCallback } from 'react'
import { useGetBundleAddon } from '@shared/hooks'
import { useAppSelector } from '@state/store'
import { useMarketAddonListQuery } from '@/services/market/getMarket'

/**
 * Why an addon isn't usable here, for its places' tooltips; null when it is in the bundle (or
 * while the bundle loads). Admins learn from the Market whether it needs a licence or isn't
 * installed; everyone else is asked to ask an admin.
 */
export const useAddonAvailability = () => {
  const { getBundleAddonVersion, isLoading } = useGetBundleAddon()
  const isAdmin = useAppSelector((state) => state.user.data.isAdmin)
  const { data: market } = useMarketAddonListQuery(undefined, { skip: !isAdmin })
  return useCallback(
    (addon: string, label: string): string | null => {
      if (isLoading || getBundleAddonVersion(addon)) return null
      if (!isAdmin) return `${label} isn't set up on this server. Ask an admin about it.`
      const listed = (
        market as
          | {
              name: string
              title?: string
              flags?: string[]
              available?: boolean
              isDownloaded?: boolean
            }[]
          | undefined
      )?.find((item) => item.name === addon)
      const title = listed?.title ?? addon
      if (listed?.flags?.includes('licensed') && !listed.available)
        return `The ${title} addon needs a licence. See the Market.`
      if (listed?.isDownloaded)
        return `The ${title} addon is installed but not in the bundle in use.`
      return `The ${title} addon isn't installed. Install it from the Market.`
    },
    [isLoading, getBundleAddonVersion, isAdmin, market],
  )
}
