import { $Any } from '@types'
import type { FilterType, MarketFilter, MarketFilterFilterAction } from './MarketFilters'

export const addonFilters: MarketFilter[] = [
  {
    id: 'all',
    type: 'addons',
    name: 'All',
    filter: [],
    tooltip: 'All addons, downloaded or not',
  },
  {
    id: 'free',
    type: 'addons',
    name: 'Free',
    filter: [
      {
        flags: (v?: string[]) => !v?.includes('licensed'),
      },
    ],
    tooltip: 'Addons free to download.',
  },
  {
    id: 'updates',
    type: 'addons',
    name: 'Updates Available',
    filter: [{ isOutdated: true }, { isDownloaded: true }],
    tooltip: 'Addons with updates available',
  },
  {
    id: 'production',
    type: 'addons',
    name: 'In Production',
    filter: [{ currentProductionVersion: (v: $Any) => v }, { isDownloaded: true }],
    tooltip: 'Addons used in the production bundle',
  },
  {
    id: 'production-outdated',
    type: 'addons',
    name: 'Production Outdated',
    filter: [
      {
        isProductionOutdated: true,
        isDownloaded: true,
        currentProductionVersion: (v: $Any) => v,
      },
    ],
    tooltip: 'Addons using an outdated version in the production bundle',
  },

  {
    id: 'uninstalled',
    type: 'addons',
    name: 'Downloads Available',
    filter: [{ isDownloaded: false }],
    tooltip: 'Addons available to download',
  },
]

export const releaseFilters: MarketFilter[] = [
  {
    id: 'latest',
    type: 'releases',
    name: 'Latest',
    filter: [{ isLatest: true }],
    tooltip: 'Latest bundle releases',
  },
  {
    id: 'all',
    type: 'releases',
    name: 'All',
    filter: [],
    tooltip: 'All bundle releases',
  },
]

export const marketFilters: {
  type: FilterType
  name: string
  filters: MarketFilter[]
}[] = [
  {
    type: 'addons',
    name: 'Addons',
    filters: addonFilters,
  },
  {
    type: 'releases',
    name: 'Release Bundles',
    filters: releaseFilters,
  },
]

// returns the filters for the selected type and filter
export const getMarketFilter = (type: string, filter: string): MarketFilterFilterAction[] => {
  const selectedFilters = marketFilters.find((f) => f.type === type)?.filters
  return selectedFilters?.find((f) => f.id === filter)?.filter || []
}
