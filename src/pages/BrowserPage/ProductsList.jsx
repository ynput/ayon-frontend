import React, { useMemo } from 'react'
import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'

const ProductsList = ({
  data,
  selectedRows,
  onSelectionChange,
  onRowClick,
  ctxMenuShow,
  onContextMenuSelectionChange,
  setColumnWidths,
  columnsWidths,
  columns,
  isLoading,
}) => {
  const handleColumnReorder = (e) => {
    const localStorageOrder = e.columns.reduce(
      (acc, cur, i) => ({ ...acc, [cur.props.field]: i }),
      {},
    )

    localStorage.setItem('products-columns-order', JSON.stringify(localStorageOrder))
  }

  // create 10 dummy rows
  const loadingData = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      key: i,
      data: {},
    }))
  }, [])

  if (isLoading) {
    data = loadingData
  }

  return (
    <TreeTable
      value={data}
      responsive="true"
      scrollHeight="100%"
      scrollable="true"
      resizableColumns
      columnResizeMode="expand"
      emptyMessage=" "
      selectionMode="multiple"
      selectionKeys={selectedRows}
      onSelectionChange={onSelectionChange}
      onRowClick={onRowClick}
      onContextMenu={(e) => ctxMenuShow(e.originalEvent)}
      onContextMenuSelectionChange={onContextMenuSelectionChange}
      onColumnResizeEnd={setColumnWidths}
      reorderableColumns
      onColReorder={handleColumnReorder}
      className={isLoading ? 'table-loading' : undefined}
    >
      {columns.map((col, i) => {
        return (
          <Column
            key={col.field}
            style={{
              ...col.style,
              width: columnsWidths[col.field] || col.width,
            }}
            bodyStyle={{ opacity: isLoading ? 0 : 1 }}
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
