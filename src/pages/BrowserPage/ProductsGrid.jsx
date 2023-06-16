import React from 'react'
import GridLayout from '/src/components/GridLayout'
import EntityGridTile from '/src/components/EntityGridTile'

const ProductsGrid = () => {
  return (
    <GridLayout ratio={1.5} minWidth={165} style={{ padding: 16 }}>
      {/* map 20 */}
      {Array.from({ length: 20 }).map((_, index) => (
        <EntityGridTile
          style={{
            minHeight: 'unset',
          }}
          key={index}
        />
      ))}
    </GridLayout>
  )
}

ProductsGrid.propTypes = {}

export default ProductsGrid
