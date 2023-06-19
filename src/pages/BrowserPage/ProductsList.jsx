import React from 'react'
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

  return (
    <TreeTable
      value={data}
      responsive="true"
      scrollHeight="100%"
      scrollable="true"
      resizableColumns
      columnResizeMode="expand"
      emptyMessage="No product found"
      selectionMode="multiple"
      selectionKeys={selectedRows}
      onSelectionChange={onSelectionChange}
      onRowClick={onRowClick}
      onContextMenu={(e) => ctxMenuShow(e.originalEvent)}
      onContextMenuSelectionChange={onContextMenuSelectionChange}
      onColumnResizeEnd={setColumnWidths}
      reorderableColumns
      onColReorder={handleColumnReorder}
    >
      {columns.map((col, i) => {
        return (
          <Column
            key={col.field}
            style={{ ...col.style, width: columnsWidths[col.field] || col.width }}
            expander={i === 0}
            resizeable={true}
            field={isLoading ? '' : col.field}
            header={col.header}
            body={isLoading ? '' : col.body}
            className={col.field}
            sortable
          />
        )
      })}
    </TreeTable>
  )
}

export default ProductsList
