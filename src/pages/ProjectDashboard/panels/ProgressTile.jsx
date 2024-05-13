import React from 'react'
import PropTypes from 'prop-types'
import { TileStyled } from './ListStatsTile'
import styled from 'styled-components'
import ProgressBar from './ProgressBar'
import getShimmerStyles from '/src/styles/getShimmerStyles'
import { Icon } from '@ynput/ayon-react-components'

const HeaderStyled = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  gap: var(--base-gap-small);
  h3 {
    flex: 1;
  }

  & > * {
    white-space: nowrap;
  }
`

const ProgressStyled = styled(TileStyled)`
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  position: relative;

  &:hover {
    background-color: var(--md-sys-color-surface-container-high);
  }
`

const StyledLoading = styled.div`
  position: absolute;
  inset: 0;
  background-color: var(--md-sys-color-surface-container-high);
  ${getShimmerStyles()}
`

const ProgressTile = ({
  title,
  subTitle,
  icon,
  onClick,
  isLoading,
  values = [],
  backgroundColor,
  onProgressClick,
}) => {
  return (
    <ProgressStyled onClick={onClick}>
      <HeaderStyled>
        {icon && <Icon icon={icon} />}
        <h3>{title || ''}</h3>
        <span>{subTitle || ''}</span>
      </HeaderStyled>
      {!!values.length && (
        <ProgressBar
          values={values}
          backgroundColor={backgroundColor}
          isLoading={isLoading}
          onClick={onProgressClick}
        />
      )}

      {isLoading && <StyledLoading />}
    </ProgressStyled>
  )
}

ProgressTile.propTypes = {
  title: PropTypes.string.isRequired,
  subTitle: PropTypes.string,
  icon: PropTypes.string,
  onClick: PropTypes.func,
  backgroundColor: PropTypes.string,
  isLoading: PropTypes.bool,
  isFetching: PropTypes.bool,
  onProgressClick: PropTypes.func,
  values: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.number.isRequired,
        color: PropTypes.string,
        label: PropTypes.string.isRequired,
      }),
    ),
  ]),
}

export default ProgressTile
