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

//  eslint-disable-next-line no-unused-vars
const ProductsGrid = ({ isLoading, data, onSelection, onContext, selected, productTypes }) => {
  const statusesObject = useSelector((state) => state.project.statuses)

  return (
    <StyledGridLayout
      style={{
        overflowY: isLoading ? 'hidden' : 'auto',
      }}
    >
      <GridLayout ratio={1.5} minWidth={170}>
        {isLoading
          ? Array.from({ length: 50 }).map((_, index) => (
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
  isLoading: PropTypes.bool.isRequired,
  data: PropTypes.array.isRequired,
  onSelection: PropTypes.func.isRequired,
  onContext: PropTypes.func.isRequired,
}

export default ProductsGrid
