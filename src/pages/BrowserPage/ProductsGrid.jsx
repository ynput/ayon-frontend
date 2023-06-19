import React from 'react'
import PropTypes from 'prop-types'
import GridLayout from '/src/components/GridLayout'
import EntityGridTile from '/src/components/EntityGridTile'
import styled from 'styled-components'
import { useSelector } from 'react-redux'

const StyledGridLayout = styled.div`
  padding: 16px;
  padding-right: 0;
  height: 100%;
  scrollbar-gutter: stable;

  &::-webkit-scrollbar {
    width: 20px;
  }
`

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
  & > * {
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

//  eslint-disable-next-line no-unused-vars
const ProductsGrid = ({ isLoading, data, onSelection, onContext, selected, productTypes }) => {
  const statusesObject = useSelector((state) => state.project.statuses)
  const isNone = data.length === 0 && !isLoading

  if (isNone) {
    return (
      <StyledGridLayout>
        <NoneFound>
          <StackedGridTiles>
            <EntityGridTile isError />
            <EntityGridTile isError />
          </StackedGridTiles>
          <span>No products found</span>
        </NoneFound>
      </StyledGridLayout>
    )
  }

  return (
    <StyledGridLayout
      style={{
        overflowY: isLoading ? 'hidden' : 'auto',
      }}
    >
      <GridLayout ratio={1.5} minWidth={170}>
        {isLoading
          ? Array.from({ length: 20 }).map((_, index) => (
              <EntityGridTile
                style={{
                  minHeight: 'unset',
                }}
                key={index}
                isLoading
              />
            ))
          : data.map(
              ({ data: product }, index) =>
                product && (
                  <EntityGridTile
                    style={{
                      minHeight: 'unset',
                    }}
                    key={index}
                    typeIcon={productTypes[product.productType]?.icon || 'inventory_2'}
                    statusIcon={statusesObject[product.status]?.icon || ''}
                    statusColor={statusesObject[product.status]?.color || ''}
                    name={product.name}
                    footer={product.versionName}
                    thumbnailEntityId={product.id}
                    thumbnailEntityType="product"
                    onClick={onSelection}
                  />
                ),
            )}
      </GridLayout>
    </StyledGridLayout>
  )
}

ProductsGrid.propTypes = {
  isLoading: PropTypes.bool,
  data: PropTypes.array,
  onSelection: PropTypes.func,
  onContext: PropTypes.func,
  selected: PropTypes.string,
  productTypes: PropTypes.object,
}

export default ProductsGrid
