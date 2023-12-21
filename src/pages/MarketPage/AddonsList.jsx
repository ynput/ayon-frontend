import React from 'react'
import MarketAddonCard from '/src/components/MarketAddonCard/MarketAddonCard'
import styled from 'styled-components'
import PerfectScrollbar from 'react-perfect-scrollbar'

const StyledList = styled(PerfectScrollbar)`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 100%;
  width: unset;
  flex: 1;
  border-radius: var(--border-radius-m);
  padding-bottom: 40px;
  min-width: 400px;
  background-color: var(--md-sys-color-surface-container-low);

  .ps__rail-y {
    z-index: 100;
  }
`

const AddonsList = ({ addons = [], selected, onSelect, onHover }) => {
  return (
    <StyledList>
      {addons.map(
        ({
          name,
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
              title={name}
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
  )
}

export default AddonsList
