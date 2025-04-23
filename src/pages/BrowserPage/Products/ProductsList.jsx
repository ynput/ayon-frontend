import React, { useRef } from 'react'
import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'
import { useDispatch, useSelector } from 'react-redux'
import { setExpandedProducts } from '@state/context'
import useTableKeyboardNavigation from '@shared/Feed/hooks/useTableKeyboardNavigation'
import clsx from 'clsx'
import useTableLoadingData from '@hooks/useTableLoadingData'

const ProductsList = ({
  treeData,
  selection,
  onSelectionChange,
  onFocus,
  ctxMenuShow,
  onContextMenuSelectionChange,
  setColumnWidths,
  columnsWidths,
  columns,
  isLoading,
  loadingProducts,
}) => {
  const dispatch = useDispatch()
  // get focused task ids
  const focusedTasks = useSelector((state) => state.context.focused.tasks)
  // get focused type
  const focusedType = useSelector((state) => state.context.focused.type)
  const expandedProducts = useSelector((state) => state.context.expandedProducts)

  const handleColumnReorder = (e) => {
    const localStorageOrder = e.columns.reduce(
      (acc, cur, i) => ({ ...acc, [cur.props.field]: i }),
      {},
    )

    localStorage.setItem('products-columns-order', JSON.stringify(localStorageOrder))
  }

  const handleGroupExpand = (e) => {
    dispatch(setExpandedProducts(e.value))
  }

  const tableRef = useRef(null)

  const handleTableKeyDown = useTableKeyboardNavigation({
    tableRef,
    treeData,
    selection,
    onSelectionChange: ({ object }) => onSelectionChange({ value: object }),
  })

  // Separate handler for non-arrow key events
  const handleKeyDown = (event) => {
    const { key } = event

    if (key === ' ') {
      event.preventDefault()
      return
    }

    // if using arrow keys change selection
    handleTableKeyDown(event)
  }

  treeData = useTableLoadingData(treeData, isLoading, 40)

  return (
    <TreeTable
      ref={tableRef}
      value={treeData}
      responsive="true"
      scrollHeight="100%"
      scrollable="true"
      resizableColumns
      columnResizeMode="expand"
      emptyMessage=" "
      selectionMode="multiple"
      selectionKeys={selection}
      onSelectionChange={onSelectionChange}
      rowClassName={(rowData) => {
        const loadingVersion = loadingProducts.includes(rowData.data.id)
        const className = {
          loading: loadingVersion || isLoading,
          'shimmer-light': loadingVersion,
          ['id-' + rowData.key]: true,
          compact: true,
        }
        if (!focusedTasks.length || focusedType !== 'task') return className

        return {
          ...className,
        }
      }}
      onContextMenu={(e) => ctxMenuShow(e.originalEvent, e.node.data.id)}
      onContextMenuSelectionChange={onContextMenuSelectionChange}
      onColumnResizeEnd={setColumnWidths}
      reorderableColumns
      onColReorder={handleColumnReorder}
      className={clsx({ loading: isLoading })}
      onToggle={handleGroupExpand}
      expandedKeys={expandedProducts}
      pt={{
        root: {
          onKeyDown: handleKeyDown,
          onFocus: onFocus,
        },
      }}
    >
      {columns.map((col, i) => {
        return (
          <Column
            key={col.field}
            style={{
              ...col.style,
              width: columnsWidths[col.field] || col.width,
            }}
            expander={i === 0}
            resizeable={true}
            field={col.field}
            header={col.header}
            body={col.body}
            className={col.field}
            sortable
          />
        )
      })}
    </TreeTable>
  )
}

export default ProductsList
