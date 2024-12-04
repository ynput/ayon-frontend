import { Panel, Section } from '@ynput/ayon-react-components'
import { MouseEvent, useState } from 'react'
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

type AddonFilterProps = {
  onSelect: (type: FilterType, filter: MarketFilterFilterAction[]) => void
  onConnection: () => void
  filterType: FilterType
}

const AddonFilters = ({ onSelect, onConnection, filterType }: AddonFilterProps) => {
  const [selected, setSelected] = useState('all')

  const addonFilters: MarketFilter[] = [
    {
      id: 'all',
      type: 'addons',
      name: 'All',
      filter: [],
      tooltip: 'All addons, downloaded or not',
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

  const releaseFilters: MarketFilter[] = [
    {
      id: 'all',
      type: 'releases',
      name: 'All',
      filter: [],
      tooltip: 'All bundle releases',
    },
  ]

  const handleSelect = (
    e: MouseEvent<HTMLDivElement>,
    type: FilterType,
    filter: MarketFilterFilterAction[],
  ) => {
    const target = e.target as HTMLDivElement
    setSelected(target.id)
    onSelect(type, filter)
  }

  return (
    <StyledSection>
      <StyledList>
        <div className={clsx('title', Type.titleMedium)}>Addons</div>
        {addonFilters.map((filter) => (
          <div
            key={filter.id}
            className={clsx('item', {
              isSelected: selected === filter.id && filterType === 'addons',
            })}
            id={filter.id}
            onClick={(e) => handleSelect(e, 'addons', filter.filter)}
            data-tooltip={filter.tooltip}
          >
            {filter.name}
          </div>
        ))}
        <div className={clsx('title', Type.titleMedium)}>Release bundles</div>
        {releaseFilters.map((filter) => (
          <div
            key={filter.id}
            className={clsx('item', {
              isSelected: selected === filter.id && filterType === 'releases',
            })}
            id={filter.id}
            onClick={(e) => handleSelect(e, 'releases', filter.filter)}
            data-tooltip={filter.tooltip}
          >
            {filter.name}
          </div>
        ))}
      </StyledList>
      {/* @ts-ignore */}
      <YnputConnector darkMode smallLogo onConnection={onConnection} />
    </StyledSection>
  )
}

export default AddonFilters
