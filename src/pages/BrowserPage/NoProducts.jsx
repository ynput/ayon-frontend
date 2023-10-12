import React from 'react'
import styled from 'styled-components'
import EntityGridTile from '/src/components/EntityGridTile'

const NoneFound = styled.div`
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
`

// stack grid tiles on top of each other
const StackedGridTiles = styled.div`
  height: 120px;
  margin-bottom: 32px;
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

const NoProducts = ({ label }) => {
  return (
    <NoneFound className="no-products">
      <StackedGridTiles>
        <EntityGridTile isError />
        <EntityGridTile isError />
      </StackedGridTiles>
      <span style={{ opacity: 0.5 }}>{label || 'No products found'}</span>
    </NoneFound>
  )
}

export default NoProducts
