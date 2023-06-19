import React from 'react'
import PropTypes from 'prop-types'
import GridLayout from '/src/components/GridLayout'
import EntityGridTile from '/src/components/EntityGridTile'
import styled from 'styled-components'

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

const ProductsGrid = ({
  isLoading,
  data,
  onItemClick,
  onSelectionChange,
  statuses,
  selection = {},
  lastSelected,
  productTypes,
  onContext,
  onContextMenuSelectionChange,
}) => {
  const isNone = data.length === 0 && !isLoading

  const handleContext = (e, id) => {
    onContextMenuSelectionChange({ value: id })
    onContext(e)
  }

  // we need to format it the same way as table
  // {value: {id: true}}
  const handleSelection = (e, product) => {
    e.preventDefault()
    const { id } = product

    const { metaKey, ctrlKey, shiftKey } = e
    const ctrlOrMeta = metaKey || ctrlKey
    const shift = shiftKey && !ctrlOrMeta

    let newSelection = {
      value: {},
    }

    // metaKey or ctrlKey or shiftKey is pressed, add to selection instead of replacing
    if (ctrlOrMeta || shift) {
      newSelection = { value: selection }
    }

    // add (selected) to selection
    if (!newSelection.value[id]) {
      // add to selection
      newSelection.value[id] = true
    } else if (ctrlOrMeta) {
      // remove from selection
      delete newSelection.value[id]
    }

    // if shift key is pressed, select all between last selected and current
    if (shift) {
      let lastSelectedIndex = data.findIndex(({ key }) => key === lastSelected)
      let currentSelectedIndex = data.findIndex(({ key }) => key === id)

      // if either lastSelectedIndex or currentSelectedIndex is not found, do nothing
      if (lastSelectedIndex === -1 || currentSelectedIndex === -1) return

      // if lastSelectedIndex is after currentSelectedIndex, swap them
      if (lastSelectedIndex > currentSelectedIndex) {
        const temp = lastSelectedIndex
        lastSelectedIndex = currentSelectedIndex
        currentSelectedIndex = temp
      }

      // select all between lastSelectedIndex and currentSelectedIndex
      for (let i = lastSelectedIndex; i <= currentSelectedIndex; i++) {
        const { id } = data[i].data
        newSelection.value[id] = true
      }
    }

    onSelectionChange(newSelection)
    // updates the breadcrumbs
    onItemClick({
      node: {
        data: product,
      },
    })
  }

  // if no data and not loading, show none found
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
                    statusIcon={statuses[product.status]?.icon || ''}
                    statusColor={statuses[product.status]?.color || ''}
                    name={product.name}
                    footer={product.versionName}
                    thumbnailEntityId={product.id}
                    thumbnailEntityType="product"
                    onClick={(e) => handleSelection(e, product)}
                    selected={product.id in selection}
                    onContextMenu={(e) => handleContext(e, product.id)}
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
  onSelectionChange: PropTypes.func,
  onItemClick: PropTypes.func,
  onContext: PropTypes.func,
  selection: PropTypes.object,
  productTypes: PropTypes.object,
  statuses: PropTypes.object,
  lastSelected: PropTypes.string,
}

export default ProductsGrid
