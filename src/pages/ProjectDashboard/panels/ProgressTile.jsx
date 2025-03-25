import React from 'react'
import { TileStyled } from './ListStatsTile'
import styled from 'styled-components'
import ProgressBar from './ProgressBar'
import { Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'

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
  gap: var(--base-gap-large);
  overflow: hidden;
  position: relative;

  &:hover {
    background-color: var(--md-sys-color-surface-container-high);
  }
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
    <ProgressStyled onClick={onClick} className={clsx({ loading: isLoading })}>
      <HeaderStyled>
        {icon && <Icon icon={icon} />}
        <h3>{title || ''}</h3>
        <span>{subTitle || ''}</span>
      </HeaderStyled>
      {!!values.length && (
        <ProgressBar values={values} backgroundColor={backgroundColor} onClick={onProgressClick} />
      )}
    </ProgressStyled>
  )
}

export default ProgressTile
