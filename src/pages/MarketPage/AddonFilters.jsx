import { Panel } from '@ynput/ayon-react-components'
import React, { useState } from 'react'
import styled from 'styled-components'
import Type from '/src/theme/typography.module.css'
import { classNames } from 'primereact/utils'

const StyledList = styled(Panel)`
  flex: 0.5;
  min-width: 200px;
  max-width: 300px;

  height: 100%;

  .item {
    display: flex;
    padding: 4px 8px;
    flex-direction: column;
    align-items: flex-start;
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

const AddonFilters = ({ onSelect }) => {
  const installFilters = [
    {
      id: 'all',
      name: 'All',
      filter: [],
    },
    {
      id: 'updates',
      name: 'Updates',
      filter: [{ isOutdated: true }, { isInstalled: true }],
    },
    {
      id: 'production',
      name: 'In Production',
      filter: [{ currentProductionVersion: (v) => v }, { isInstalled: true }],
    },
    {
      id: 'production-outdated',
      name: 'Production Outdated',
      filter: [
        { isProductionOutdated: true, isInstalled: true, currentProductionVersion: (v) => v },
      ],
    },

    {
      id: 'uninstalled',
      name: 'Recommended',
      filter: [{ isInstalled: false }],
    },
  ]

  const [selected, setSelected] = useState('')

  const handleSelect = (e, filter) => {
    setSelected(e.target.id)
    onSelect(filter)
  }

  return (
    <StyledList>
      <div className={classNames('title', Type.titleMedium)}>Installed</div>
      {installFilters.map((filter) => (
        <div
          key={filter.id}
          className={classNames('item', { isSelected: selected === filter.id })}
          id={filter.id}
          onClick={(e) => handleSelect(e, filter.filter)}
        >
          {filter.name}
        </div>
      ))}
    </StyledList>
  )
}

export default AddonFilters
