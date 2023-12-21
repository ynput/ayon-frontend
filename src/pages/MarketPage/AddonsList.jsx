import React, { useMemo, useState } from 'react'
import MarketAddonCard from '/src/components/MarketAddonCard/MarketAddonCard'
import styled from 'styled-components'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { InputText } from '@ynput/ayon-react-components'

const StyledAddonList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
  height: 100%;
  min-width: 400px;
  overflow: hidden;
  flex: 1;

  .search {
    padding: 2px;

    width: 100%;
  }
`

const StyledInput = styled(InputText)`
  max-height: 40px;
  height: 40px;
  width: 100%;
`

const StyledList = styled(PerfectScrollbar)`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 100%;
  width: unset;
  border-radius: var(--border-radius-m);
  padding-bottom: 40px;
  background-color: var(--md-sys-color-surface-container-low);

  .ps__rail-y {
    z-index: 100;
  }
`

const AddonsList = ({ addons = [], selected, onSelect, onHover }) => {
  const [search, setSearch] = useState('')

  // filter addons by search
  const filteredAddons = useMemo(
    () =>
      addons.filter(
        (addon) =>
          addon.name?.toLowerCase().includes(search.toLowerCase()) ||
          addon.description?.toLowerCase().includes(search.toLowerCase()),
      ),
    [addons, search],
  )

  return (
    <StyledAddonList>
      <div className="search">
        <StyledInput
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <StyledList>
        {filteredAddons.map(
          ({
            name,
            title,
            orgTitle,
            icon,
            isOfficial,
            isVerified,
            isInstalled,
            isOutdated,
            isPlaceholder,
          }) => {
            return (
              <MarketAddonCard
                key={name}
                title={title}
                author={orgTitle}
                icon={icon}
                isOfficial={isOfficial}
                isVerified={isVerified}
                isInstalled={isInstalled}
                isOutdated={isOutdated}
                onClick={() => onSelect(name)}
                isSelected={selected === name}
                isPlaceholder={isPlaceholder}
                onMouseOver={() => onHover(name)}
              />
            )
          },
        )}
      </StyledList>
    </StyledAddonList>
  )
}

export default AddonsList
