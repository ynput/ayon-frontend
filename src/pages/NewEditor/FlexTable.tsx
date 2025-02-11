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
import useHandlers, { handleToggleFolder } from './handlers'
import { getAbsoluteSelections, isSelected } from './mappers/mappers'
import TableColumns from './TableColumns'
import * as Styled from './Table.styled'
import { useCustomColumnWidths, useSyncCustomColumnWidths } from './hooks/useCustomColumnsWidth'
import { toast } from 'react-toastify'
import useOverviewPreferences from '@pages/ProjectOverviewPage/hooks/useOverviewPreferences'
import useCellHelper from './helpers/cellHelpers'
import useSelectionHandler from './hooks/useSelectionHandler'
import { useGetProjectsInfoQuery } from '@queries/userDashboard/getUserDashboard'
import { useSelector } from 'react-redux'
import getAllProjectStatuses from '@containers/DetailsPanel/helpers/getAllProjectsStatuses'
import useAttributeFields from './hooks/useAttributesList'
import useUpdateEditorEntities from './hooks/useUpdateEditorEntities'
import { useGetUsersAssigneeQuery } from '@queries/user/getUsers'

type Props = {
  tableData: $Any[]
  rawData: { folders: $Any; tasks: $Any }
  isLoading: boolean
  isExpandable: boolean
  sliceId: string
  filters: $Any
}

const FlexTable = ({
  tableData,
  rawData,
  isLoading,
  isExpandable,
  sliceId,
  filters,
}: Props) => {
  //The virtualizer needs to know the scrollable container element
  const tableContainerRef = useRef<HTMLDivElement>(null)

  const projectName = useSelector((state: $Any) => state.project.name)
  const { data: projectsInfo = {} } = useGetProjectsInfoQuery({ projects: [projectName] })
  const projectInfo = projectsInfo[projectName] || {}
  const statuses = getAllProjectStatuses({ [projectName]: projectInfo })
  const { attribFields: attribs } = useAttributeFields()
  const { data: users = [] } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })
  const { updateEntities } = useUpdateEditorEntities({ projectName, filters })
  const [copyValue, setCopyValue] = useState<{ [key: string]: $Any } | null>(null)

  const {
    selection,
    setSelection,
    selections,
    setSelections,
    setSelectionInProgress,
    getSelectionInterval,
  } = useSelectionHandler()

  const { handleMouseUp, handleMouseDown } = useHandlers({
    selection,
    setSelection,
    selections,
    setSelections,
    setSelectionInProgress,
  })

  const { getCopyCellData, getUpdatesList } = useCellHelper(rawData)

  const { expanded, updateExpanded } = useOverviewPreferences()
  const [itemExpanded, setItemExpanded] = useState<string>('root')
  const toggleExpanderHandler = handleToggleFolder(setItemExpanded)

  const columns = TableColumns({
    tableData,
    rawData,
    users,
    statuses,
    attribs,
    isLoading,
    isExpandable,
    sliceId,
    toggleExpanderHandler,
    updateHandler: (
      id: string,
      field: string,
      val: string,
      entityType: string,
      isAttrib: boolean = true,
    ) => {
      try {
        updateEntities(field, val, [{ id, type: entityType }], isAttrib)
      } catch (e) {
        toast.error('Error updating entity')
      }
    },
  })

  const table = useReactTable({
    data: tableData,
    columns,
    enableRowSelection: true,
    getRowId: (row) => row.id,
    enableSubRowSelection: false,
    getSubRows: (row) => row.subRows,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    filterFromLeafRows: true,
    onExpandedChange: updateExpanded,
    columnResizeMode: 'onChange',
    // @ts-ignore
    filterFns,
    state: {
      expanded,
    },
  })

  const { rows } = table.getRowModel()

  const absoluteSelections = getAbsoluteSelections(selections)

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    overscan: 5,
    estimateSize: () => 40, 
    getScrollElement: () => tableContainerRef.current,
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
  })

  const columnSizeVars = useCustomColumnWidths(table)
  useSyncCustomColumnWidths(table.getState().columnSizing)

  const handleKeyDown = (e: $Any, cell: $Any, colIdx: number) => {
    if (e.key === 'c' && e.ctrlKey) {
      handleCopy(cell, colIdx)
    }
    if (e.key === 'v' && e.ctrlKey) {
      handlePaste()
    }
  }

  const handleCopy = (cell: $Any, colIdx: number) => {
    const cellData = getCopyCellData(cell.row, cell.column.id)
    setCopyValue({ data: cellData, colIdx })
  }

  const handlePaste = async () => {
    if (copyValue === null) {
      return
    }

    const matchingSets = getSelectionInterval(copyValue.colIdx)
    const updates = getUpdatesList(matchingSets, rows)

    if (updates.length === 0) {
      toast.error('Operation failed, please paste copied value into matching column.')
      return
    }

    try {
      await updateEntities(
        copyValue!.data.type,
        copyValue!.data.value,
        updates,
        copyValue!.data.isAttrib,
      )
    } catch (e) {
      toast.error('Error updating entity')
    }
    // updateAttribute(row.id, copyValue!.type, copyValue!.value, copyValue!.isAttrib)
  }

  const tableBody = (
    <tbody style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
      {rowVirtualizer.getVirtualItems().map((virtualRow: $Any, rowIdx) => {
        const row = rows[virtualRow.index] as Row<TableRow>
        return (
          <tr
            data-index={virtualRow.index} //needed for dynamic row height measurement
            // @ts-ignore
            // TODO it was triggering 'maximum calls exceeded' after scrolling for a while, not sure how it's used, commenting it out for now
            // ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
            key={row.id}
            style={{
              display: 'table-row',
              transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
            }}
          >
            {row.getVisibleCells().map((cell, colIdx) => {
              return (
                <Styled.TableCell
                  tabIndex={0}
                  key={cell.id}
                  className={clsx(
                    `pos-${rowIdx}-${colIdx}`,
                    cell.column.id === 'folderType' ? 'large' : '',
                    {
                      notSelected: !isSelected(absoluteSelections, virtualRow.index, colIdx),
                      selected: isSelected(absoluteSelections, virtualRow.index, colIdx),
                    },
                  )}
                  style={{ width: `calc(var(--col-${cell.column.id}-size) * 1px)` }}
                  onKeyDown={(e) => handleKeyDown(e, cell, colIdx)}
                  onMouseDown={(e: $Any) => handleMouseDown(e, virtualRow.index, colIdx)}
                  onMouseUp={(e: $Any) => handleMouseUp(e, virtualRow.index, colIdx)}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Styled.TableCell>
              )
            })}
          </tr>
        )
      })}
    </tbody>
  )

  return (
    <Styled.TableContainerWrapper style={{ height: '100%' }}>
      <Styled.TableContainer ref={tableContainerRef} style={{ height: '100%' }}>
        <table
          style={{
            borderCollapse: 'collapse',
            userSelect: 'none',
            ...columnSizeVars,
            width: table.getTotalSize(),
          }}
        >
          <Styled.TableHeader>
            {table.getHeaderGroups().map((headerGroup) => {
              return (
                <div key={headerGroup.id} style={{ display: 'flex' }}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <Styled.HeaderCell
                        className={clsx({ large: header.column.id === 'folderType' })}
                        key={header.id}
                        style={{
                          position: 'relative',
                          minWidth: '160px',
                          width: `calc(var(--header-${header?.id}-size) * 1px)`,
                        }}
                      >
                        {header.isPlaceholder ? null : (
                          <Styled.TableCellContent
                            className={clsx('bold', { large: header.column.id === 'folderType' })}
                            style={{ paddingRight: 0 }}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <Styled.ResizedHandler
                              {...{
                                onDoubleClick: () => header.column.resetSize(),
                                onMouseDown: header.getResizeHandler(),
                                onTouchStart: header.getResizeHandler(),
                                className: `resize-handler ${
                                  header.column.getIsResizing() ? 'isResizing' : ''
                                }`,
                              }}
                            />
                          </Styled.TableCellContent>
                        )}
                      </Styled.HeaderCell>
                    )
                  })}
                </div>
              )
            })}
          </Styled.TableHeader>
          {tableBody}
        </table>
      </Styled.TableContainer>
    </Styled.TableContainerWrapper>
  )
}

export default FlexTable