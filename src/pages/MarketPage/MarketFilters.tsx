import { Panel, Section } from '@ynput/ayon-react-components'
import { Fragment, MouseEvent } from 'react'
import styled from 'styled-components'
import Type from '@/theme/typography.module.css'
import clsx from 'clsx'
import YnputConnector from '@components/YnputCloud/YnputConnector'
import { $Any } from '@types'

const StyledSection = styled(Section)`
  height: 100%;
  flex: 0.5;
  min-width: 210px;
  max-width: 300px;
`

const StyledList = styled(Panel)`
  height: 100%;

  .item {
    display: flex;
    padding: 4px 8px;
    flex-direction: column;
    align-items: flex-start;
    user-select: none;
    gap: 10px;
    align-self: stretch;
    border-radius: var(--border-radius-m);
    cursor: pointer;
    &:hover {
      background-color: var(--md-sys-color-surface-container);
    }

    &.isSelected {
      background-color: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
    }
  }
`

type MarketFilterFilterAction = { [key: string]: any } | ((v: any) => any)
type FilterType = 'addons' | 'releases'
type MarketFilter = {
  id: string
  type: FilterType
  name: string
  filter: MarketFilterFilterAction[]
  tooltip: string
}

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

type MarketFiltersProps = {
  selected: string
  onSelect: (type: FilterType, id: string) => void
  onConnection: () => void
  filterType: FilterType
}

const MarketFilters = ({ onSelect, selected, onConnection, filterType }: MarketFiltersProps) => {
  const handleSelect = (e: MouseEvent<HTMLDivElement>, type: FilterType) => {
    const target = e.target as HTMLDivElement
    onSelect(type, target.id)
  }

  return (
    <StyledSection>
      <StyledList>
        {marketFilters.map((filter) => (
          <Fragment key={filter.type}>
            <div className={clsx('title', Type.titleMedium)}>{filter.name}</div>
            {filter.filters.map((f) => (
              <div
                key={f.id}
                className={clsx('item', {
                  isSelected: selected === f.id && filter.type === filterType,
                })}
                id={f.id}
                onClick={(e) => handleSelect(e, filter.type)}
                data-tooltip={f.tooltip}
              >
                {f.name}
              </div>
            ))}
          </Fragment>
        ))}
      </StyledList>
      {/* @ts-ignore */}
      <YnputConnector darkMode smallLogo onConnection={onConnection} />
    </StyledSection>
  )
}

export default MarketFilters
