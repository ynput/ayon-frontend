import { Panel, Section } from '@ynput/ayon-react-components'
import { Fragment, MouseEvent } from 'react'
import styled from 'styled-components'
import Type from '@/theme/typography.module.css'
import clsx from 'clsx'
import YnputConnector from '@components/YnputCloud/YnputConnector'
import { marketFilters } from './MarketFiltersHelpers'

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

export type MarketFilterFilterAction = { [key: string]: any } | ((v: any) => any)
export type FilterType = 'addons' | 'releases'
export type MarketFilter = {
  id: string
  type: FilterType
  name: string
  filter: MarketFilterFilterAction[]
  tooltip: string
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
