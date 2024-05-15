import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import getShimmerStyles from '/src/styles/getShimmerStyles'
import { Icon } from '@ynput/ayon-react-components'

export const TileStyled = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  background-color: var(--md-sys-color-surface-container-high);
  padding: 12px 8px;
  border-radius: var(--base-input-border-radius);
  user-select: none;
  cursor: pointer;
  width: 100%;
  position: relative;
  overflow: hidden;

  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }

  h3 {
    flex: 1;
    margin: 0;
    padding: 0;
    height: 16px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    border-bottom: unset;
    display: block;
  }
`

const StyledLoading = styled.div`
  position: absolute;
  inset: 0;
  background-color: var(--md-sys-color-surface-container-high);
  ${getShimmerStyles()}
`

const ListStatsTile = ({ title, stat, icon, isLoading, onClick }) => {
  return (
    <TileStyled onClick={onClick}>
      {icon && <Icon icon={icon} />}
      <h3>{title}</h3>
      <span>{isLoading ? '' : stat || 'unknown'}</span>
      {isLoading && <StyledLoading />}
    </TileStyled>
  )
}

ListStatsTile.propTypes = {
  title: PropTypes.string.isRequired,
  stat: PropTypes.number,
  icon: PropTypes.string,
  isLoading: PropTypes.bool,
  onClick: PropTypes.func,
}

export default ListStatsTile
