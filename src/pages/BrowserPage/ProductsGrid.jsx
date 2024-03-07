import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import GridLayout from '/src/components/GridLayout'
import { EntityCard } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'

const StyledGridLayout = styled(PerfectScrollbar)`
  padding: 12px;
  height: 100%;

  & > * {
    margin-bottom: 16px;
  }
`

const StyledGroupName = styled.h2`
  font-size: 1.3em;
  padding-left: 8px;
  margin: 0;
  margin-bottom: 8px;
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
  groupBy = null,
  multipleFoldersSelected = false,
  projectName,
}) => {
  const isNone = data.length === 0

  const handleContext = (e, id) => {
    onContextMenuSelectionChange({ value: id })
    onContext(e)
  }

  data = useMemo(() => {
    let flattenedData = data

    // flatten data
    if (multipleFoldersSelected) {
      // for each data, check if it has children and if it does, flatten it
      flattenedData = flattenedData.reduce((acc, curr) => {
        if (curr.children) {
          return [...acc, ...curr.children]
        }
        return [...acc, curr]
      }, [])
    }

    return flattenedData
  }, [data, multipleFoldersSelected])

  // we need to format it the same way as table
  // {value: {id: true}}
  const handleSelection = (e, product) => {
    e.preventDefault()
    e.stopPropagation()
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

  // if groupBy is set, group the data

  const groupedData = useMemo(() => {
    if (groupBy && !isLoading && !isNone) {
      return data.reduce((acc, curr) => {
        const { data: product, isGroup } = curr
        const group = isGroup ? product.name : product[groupBy] || 'Other'

        // if group is not in acc, add it
        if (!acc[group]) {
          acc[group] = []
        }

        // add product to group
        acc[group].push(curr)

        return acc
      }, {})
    } else {
      return { '': data }
    }
  }, [data, groupBy])

  return (
    <StyledGridLayout
      style={{
        zIndex: 1,
      }}
      onClick={() => onSelectionChange({ value: {} })}
    >
      {Object.entries(groupedData).map(([groupName, groupData], index) => (
        <div key={`groupname-${groupName}`}>
          {groupName && <StyledGroupName>{groupName}</StyledGroupName>}
          <GridLayout ratio={1.777777} minWidth={200} key={index}>
            {isLoading
              ? Array.from({ length: 20 }).map((_, index) => <EntityCard key={index} isLoading />)
              : groupData.map(
                  ({ data: product }, index) =>
                    product && (
                      <EntityCard
                        style={{
                          minHeight: 'unset',
                          minWidth: 'unset',
                        }}
                        key={index}
                        title={product.name}
                        titleIcon={productTypes[product.productType]?.icon || 'inventory_2'}
                        icon={statuses[product.versionStatus]?.icon || ''}
                        iconColor={statuses[product.versionStatus]?.color || ''}
                        imageUrl={`/api/projects/${projectName}/versions/${
                          product.versionId
                        }/thumbnail?updatedAt=${
                          product.versionUpdatedAt
                        }&token=${localStorage.getItem('accessToken')}`}
                        subTitle={`${product.versionName}${
                          multipleFoldersSelected && product.folder ? ' - ' + product.folder : ''
                        }`}
                        onClick={(e) => handleSelection(e, product)}
                        isActive={product.id in selection}
                        onContextMenu={(e) => handleContext(e, product.id)}
                        projectName={projectName}
                        isFullHighlight
                        isActiveAnimate
                      />
                    ),
                )}
          </GridLayout>
        </div>
      ))}
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
  onContextMenuSelectionChange: PropTypes.func,
  groupBy: PropTypes.string,
}

export default ProductsGrid
