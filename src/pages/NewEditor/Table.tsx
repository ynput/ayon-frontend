import { useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  filterFns,
  flexRender,
  Row,
} from '@tanstack/react-table'

import clsx from 'clsx'

import { $Any } from '@types'
import { TableRow } from '@containers/Slicer/types'
import useHandlers, { Selection } from './handlers'
import { getAbsoluteSelections, isSelected } from './mappers'
import { getColumns } from './TableColumns'
import * as Styled from './Table.styled'

type Props = {
  tableData: $Any[]
  rawData: { folders: $Any; tasks: $Any }
  attribs: $Any[]
  isLoading: boolean
  isExpandable: boolean
  sliceId: string
  toggleExpanderHandler: $Any
  expanded: $Any
  setExpanded: $Any
}

const MyTable = ({
  tableData,
  rawData,
  attribs,
  isLoading,
  isExpandable,
  sliceId,
  toggleExpanderHandler,
  expanded,
  setExpanded,
}: Props) => {
  const columns = getColumns({
    tableData,
    rawData,
    attribs,
    isLoading,
    isExpandable,
    sliceId,
    toggleExpanderHandler,
  })

  const table = useReactTable({
    data: tableData,
    columns,
    enableRowSelection: true, //enable row selection for all rows
    getRowId: (row) => row.id,
    enableSubRowSelection: false, //disable sub row selection
    getSubRows: (row) => row.subRows,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    filterFromLeafRows: true,
    onExpandedChange: setExpanded,
    // @ts-ignore
    filterFns,
    state: {
      expanded,
    },
  })

  const { rows } = table.getRowModel()

  //The virtualizer needs to know the scrollable container element
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [selectionInProgress, setSelectionInProgress] = useState<boolean>(false)
  const [selection, setSelection] = useState<Selection>({})
  const [selections, setSelections] = useState<Selection[]>([])

  const { handleMouseUp, handleMouseDown } = useHandlers({
    selection,
    setSelection,
    selections,
    setSelections,
    setSelectionInProgress,
  })

  const absoluteSelections = getAbsoluteSelections(selections)

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 40, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  })

  return (
    <Styled.TableContainerWrapper style={{ height: '100%' }}>
      <Styled.TableContainer ref={tableContainerRef} style={{ height: '100%' }}>
        <table style={{ borderCollapse: 'collapse' }}>
          <Styled.TableHeader>
            {table.getHeaderGroups().map((headerGroup) => {
              return (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <Styled.HeaderCell
                        className={clsx({ large: header.column.id === 'folderType' })}
                        key={header.id}
                        colSpan={header.colSpan}
                      >
                        {header.isPlaceholder ? null : (
                          <Styled.TableCellContent
                            className={clsx('bold', { large: header.column.id === 'folderType' })}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </Styled.TableCellContent>
                        )}
                      </Styled.HeaderCell>
                    )
                  })}
                </tr>
              )
            })}
          </Styled.TableHeader>

          <tbody style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow: $Any, rowIdx) => {
              const row = rows[virtualRow.index] as Row<TableRow>
              return (
                <tr
                  data-index={virtualRow.index} //needed for dynamic row height measurement
                  // @ts-ignore
                  ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
                  key={row.id + rowIdx}
                  style={{
                    display: 'table-row',
                    transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
                  }}
                >
                  {row.getVisibleCells().map((cell, colIdx) => {
                    return (
                      <Styled.TableCell
                        key={cell.id + colIdx}
                        className={clsx(
                          `pos-${rowIdx}-${colIdx}`,
                          cell.column.id === 'folderType' ? 'large' : '',
                          {
                            notSelected: !isSelected(absoluteSelections, rowIdx, colIdx),
                            selected: isSelected(absoluteSelections, rowIdx, colIdx),
                          },
                        )}
                        onMouseDown={(e) => {
                          // @ts-ignore
                          handleMouseDown(e, cell, rowIdx, colIdx)
                        }}
                        onMouseUp={(e) => {
                          // @ts-ignore
                          handleMouseUp(e, cell, rowIdx, colIdx)
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Styled.TableCell>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </Styled.TableContainer>
    </Styled.TableContainerWrapper>
  )
}

export default MyTable
