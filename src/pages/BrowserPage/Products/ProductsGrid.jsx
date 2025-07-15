import React, { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import GridLayout from '@components/GridLayout'
import { Button, EntityCard, Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import clsx from 'clsx'
import Shortcuts from '@containers/Shortcuts'

import { useProjectContext } from '@context/ProjectContext'

const StyledGridLayout = styled(PerfectScrollbar)`
  padding: 4px 12px;
  height: 100%;
  position: relative;
`

const StyledGroup = styled.div`
  .icon {
    transition: rotate 200ms;
  }
  &.isCollapsed {
    /* rotate icon */
    [icon='expand_more'] {
      rotate: -90deg;
    }
  }

  .header-wrapper {
    padding: 8px 0;
    position: sticky;
    top: -8px;

    z-index: 100;
    background-color: var(--md-sys-color-surface-container-low);
  }
`

const StyledGroupHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);
  padding: var(--padding-s);
  user-select: none;

  &:hover {
    cursor: pointer;
    background-color: var(--md-sys-color-surface-container-low-hover);
    border-radius: var(--border-radius-m);
  }

  .content {
    display: flex;
    align-items: flex-end;
    gap: var(--base-gap-large);

    .count {
      color: var(--md-sys-color-outline);
    }
  }

  h2 {
    font-size: 1.3em;
    margin: 0;
    user-select: none;
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
  onContext,
  groupBy = null,
  multipleFoldersSelected = false,
}) => {
  const isNone = data.length === 0
  const project = useProjectContext()

  const handleContext = (e, id) => {
    onContext(e, id)
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
    onItemClick(product)
  }

  const [collapsedGroups, setCollapsedGroups] = useState([])

  const handleCollapseChange = (groupName) => {
    if (collapsedGroups.includes(groupName)) {
      setCollapsedGroups(collapsedGroups.filter((group) => group !== groupName))
    } else {
      setCollapsedGroups([...collapsedGroups, groupName])
    }
  }

  const handleShortcutCollapse = (event) => {
    const target = event?.target
    if (!target) return

    // get id of the group
    let groupName = target.querySelector('.products-group')?.id
    if (!groupName) {
      groupName = target.closest('.products-group')?.id
    }

    if (groupName) {
      handleCollapseChange(groupName)
    }
  }

  const shortcuts = useMemo(
    () => [
      {
        key: 'c',
        action: handleShortcutCollapse,
        closest: '.products-group',
      },
    ],
    [collapsedGroups],
  )

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
      onKeyDown={(e) => e.key === ' ' && e.preventDefault()}
    >
      <Shortcuts shortcuts={shortcuts} deps={[collapsedGroups]} />
      {Object.entries(groupedData).map(([groupName, groupData], index) => (
        <StyledGroup
          key={groupName}
          id={groupName}
          className={clsx({ isCollapsed: collapsedGroups.includes(groupName) }, 'products-group')}
        >
          {groupName && (
            <div className="header-wrapper">
              <StyledGroupHeader
                onClick={() => handleCollapseChange(groupName)}
                className="products-group-header"
              >
                <Button
                  icon="expand_more"
                  variant="text"
                  data-tooltip={'Collapse/Expand'}
                  data-shortcut={'C'}
                  data-tooltip-delay={300}
                />
                <span className="content">
                  <Icon icon={ project.getProductTypeIcon(groupName) || 'inventory_2'} />
                  <h2>{groupName}</h2>
                  <span className="count">{groupData.length}</span>
                </span>
              </StyledGroupHeader>
            </div>
          )}
          {!collapsedGroups.includes(groupName) && (
            <GridLayout ratio={1.777777} minWidth={190} key={index}>
              {isLoading
                ? Array.from({ length: 20 }).map((_, index) => (
                    <EntityCard
                      key={index}
                      isLoading
                      style={{
                        minWidth: 'unset',
                      }}
                      loadingSections={['header', 'title', 'users', 'status']}
                    />
                  ))
                : groupData.map(({ data: product }, index) => {
                    if (!product) return null
                    const thumbnailUrl = `/api/projects/${project.name}/versions/${product.versionId}/thumbnail?updatedAt=${product.versionUpdatedAt}`
                    const status = statuses[product.versionStatus]

                    return (
                      <EntityCard
                        style={{
                          minWidth: 'unset',
                        }}
                        key={index}
                        header={product.name}
                        path={multipleFoldersSelected && product.folder}
                        title={product.versionName}
                        titleIcon={project.getProductTypeIcon(product.productType) || 'layers'}
                        users={[{ name: product.versionAuthor }]}
                        imageIcon={project.getProductTypeIcon(product.productType) || 'inventory_2'}
                        status={status}
                        hidePriority
                        imageUrl={project.name && thumbnailUrl}
                        onClick={(e) => handleSelection(e, product)}
                        isActive={product.id in selection}
                        onContextMenu={(e) => handleContext(e, product.id)}
                        isPlayable={product.hasReviewables}
                      />
                    )
                  })}
            </GridLayout>
          )}
        </StyledGroup>
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
  statuses: PropTypes.object,
  lastSelected: PropTypes.string,
  groupBy: PropTypes.string,
}

export default ProductsGrid
