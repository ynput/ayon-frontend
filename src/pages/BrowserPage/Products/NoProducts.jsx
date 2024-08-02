import { Icon } from '@ynput/ayon-react-components'
import React from 'react'
import styled from 'styled-components'

const NoneFound = styled.div`
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--base-gap-large);
`

const GridTile = styled.div`
  width: 230px;
  height: 130px;
  background-color: var(--md-sys-color-surface-container-low);
  border: solid 4px var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-xxl);

  span {
    height: 28px;
    width: 130px;
    border-radius: var(--border-radius-l);
    background-color: var(--md-sys-color-surface-container-high);

    position: absolute;
    top: 4px;
    left: 4px;
  }
`

// stack grid tiles on top of each other
const StackedGridTiles = styled.div`
  height: 120px;
  margin-bottom: 32px;
  display: flex;
  justify-content: center;

  & > div {
    position: absolute;
    height: 120px;
    opacity: 1;
  }

  /* rotate out like a fan */
  & > *:nth-child(1) {
    transform: rotate(-10deg) translateX(-10px);
    transform-origin: bottom;
  }

  & > *:nth-child(2) {
    transform: rotate(10deg) translateX(10px);
    transform-origin: bottom;
  }
`

const Message = styled.span`
  color: var(--md-sys-color-outline);
`

const Error = styled.span`
  &,
  .icon {
    color: var(--md-sys-color-error-container);
  }
  background-color: var(--md-sys-color-on-error-container);
  padding: var(--padding-m) var(--padding-m);
  border-radius: var(--border-radius-m);

  display: flex;
  align-items: center;
  gap: var(--base-gap-large);
`

const NoProducts = ({ label, error }) => {
  return (
    <NoneFound className="no-products">
      <StackedGridTiles>
        <GridTile>
          <span />
        </GridTile>
        <GridTile>
          <span />
        </GridTile>
      </StackedGridTiles>
      <Message>{label || 'No products found'}</Message>
      {error && (
        <Error>
          <Icon icon="error" />
          Error: {JSON.stringify(error) || 'Unknown'}
        </Error>
      )}
    </NoneFound>
  )
}

export default NoProducts
