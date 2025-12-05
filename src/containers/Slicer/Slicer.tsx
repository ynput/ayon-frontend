import { FC, useCallback, useEffect, useState } from 'react'
import SimpleTable, { Container, Header } from '@shared/containers/SimpleTable'

import useTableDataBySlice from './hooks/useTableDataBySlice'
import SlicerSearch from './SlicerSearch'
import clsx from 'clsx'
import { SliceType } from '@shared/containers/Slicer'
import { SimpleTableProvider } from '@shared/containers/SimpleTable'
import { useSlicerContext } from '@context/SlicerContext'
import { RowSelectionState } from '@tanstack/react-table'
import { SliceTypeField } from './types'
import { useCreateContextMenu } from '@shared/containers'
import useSectionMenuItems from '@containers/Slicer/hooks/useSectionMenuItems.tsx'

interface SlicerProps {
  sliceFields: SliceTypeField[]
  entityTypes?: string[] // entity types
  persistFieldId?: SliceType // when changing slice type, leavePersistentSlice the selected field
}

const Slicer: FC<SlicerProps> = ({
  sliceFields = [],
  entityTypes = ['task'],
  persistFieldId,
}) => {
  const [globalFilter, setGlobalFilter] = useState('')
  const {
    SlicerDropdown,
    rowSelection,
    setRowSelection,
    onRowSelectionChange,
    expanded,
    setExpanded,
    onExpandedChange,
  } = useSlicerContext()

  const {
    sliceOptions,
    sliceType,
    handleSliceTypeChange,
    table: { data: sliceTableData, isExpandable },
    sliceMap,
    isLoading: isLoadingSliceTableData,
  } = useTableDataBySlice({ sliceFields, entityTypes })

  const [ctxMenuShow] = useCreateContextMenu()

  const handleExpand = useCallback(
    (selectedIds: string[]) => {
      const currentExpanded = expanded || {}
      const newExpanded = { ...(currentExpanded as Record<string, boolean>) }
      selectedIds.forEach((id) => {
        newExpanded[id] = true
      })
      setExpanded(newExpanded)
    },
    [expanded, setExpanded],
  )

  const handleCollapse = useCallback(
    (selectedIds: string[]) => {
      const currentExpanded = expanded || {}
      const newExpanded = { ...(currentExpanded as Record<string, boolean>) }
      selectedIds.forEach((id) => {
        delete newExpanded[id]
      })
      setExpanded(newExpanded)
    },
    [expanded, setExpanded],
  )

  const handleDelete = useCallback(
    (selectedIds: string[]) => {
      console.log('Delete selected items:', selectedIds)
      // Add your delete logic here
    },
    [],
  )

  const buildMenuItems = useSectionMenuItems({
    onDelete: handleDelete,
    onExpand: handleExpand,
    onCollapse: handleCollapse,
  })

  const menuItems = buildMenuItems(rowSelection, {
    command: true,
    dividers: false,
    // hidden: {
    //   'add-project': true,
    //   search: true,
    //   'select-all': true,
    // },
  })
  console.log(rowSelection)
  const openContext = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault()
      e.stopPropagation()


      if (!menuItems) return
      // contextMenuItems is already an array of menu items, pass it directly

      ctxMenuShow(e, menuItems)
    },
    [ctxMenuShow, menuItems],
  )


  const handleSelectionChange = (s: RowSelectionState) => {
    setRowSelection(s)
    onRowSelectionChange?.(s, sliceMap)
  }

  // on first mount, check that current sliceType is in sliceFields, if not, change to first option
  useEffect(() => {
    const isAttribute = sliceType.startsWith('attrib.')
    if (
      !sliceFields.some((field) => field.value === sliceType) &&
      !(isAttribute && sliceFields.some((field) => field.value === 'attributes'))
    ) {
      handleSliceTypeChange(sliceFields[0].value, false, false)
    }
  }, [])

  return (
    <Container>
      <Header>
        <SlicerDropdown
          options={sliceOptions || []}
          value={[sliceType]}
          sliceTypes={sliceFields.map((field) => field.value)}
          onChange={(value: any) =>
            handleSliceTypeChange(
              value[0] as SliceType,
              persistFieldId === sliceType,
              persistFieldId === value[0],
            )
          }
          className={clsx('slicer-dropdown', { 'single-option': sliceOptions.length === 1 })}
          disableOpen={sliceOptions.length === 1}
        />
        <SlicerSearch value={globalFilter} onChange={setGlobalFilter} />
      </Header>
      <SimpleTableProvider
        {...{
          rowSelection,
          onRowSelectionChange: handleSelectionChange,
          expanded,
          setExpanded,
          onExpandedChange,
          data: sliceMap,
        }}
      >
        <SimpleTable
          data={sliceTableData}
          isExpandable={isExpandable}
          isLoading={isLoadingSliceTableData}
          forceUpdateTable={sliceType}
          globalFilter={globalFilter}
          pt={{
            row: {
              onContextMenu: openContext,
            },
          }}
        />
      </SimpleTableProvider>
    </Container>
  )
}

export default Slicer
