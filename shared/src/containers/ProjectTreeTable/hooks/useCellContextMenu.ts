import { ContextMenuItemType, useCreateContextMenu } from '../../ContextMenu/useCreateContextMenu'
import useDeleteEntities from './useDeleteEntities'
import { getPlatformShortcutKey, KeyMode } from '../../../util/platform'
import { getCellId, parseCellId } from '../utils/cellUtils'
import { useClipboard } from '../context/ClipboardContext'
import { ROW_SELECTION_COLUMN_ID, useSelectionCellsContext } from '../context/SelectionCellsContext'
import { useProjectTableContext } from '../context/ProjectTableContext'
import { useProjectDataContext } from '../context/ProjectDataContext'
import { useCellEditing } from '../context/CellEditingContext'
import { InheritFromParentEntity } from './useUpdateTableData'
import { ProjectTableAttribute, TableRow } from '../types'
import { UseHistoryReturn } from './useHistory'
import { GROUP_BY_ID } from './useBuildGroupByTableData'
import { ColumnDef } from '@tanstack/react-table'
import { EntityMap, getEntityViewierIds } from '../utils'
import { isEntityRestricted } from '../utils/restrictedEntity'
import { useMemo } from 'react'
import { useProjectContext } from '@shared/context'

type ContextEvent = React.MouseEvent<HTMLTableSectionElement, MouseEvent>

export type HeaderLabel = { id: string; label: string }

export type TableCellContextData = {
  cellId: string
  columnId: string
  entityId: string
  entityType: 'folder' | 'task' | 'product' | 'version' | 'unknown' | undefined
  parentId?: string
  attribField: ProjectTableAttribute | undefined // the attribute field if any (fps, custom attribs, etc.)
  column: {
    id: string
    label: string
  }
  isGroup: boolean // if the cell is a group header
  data?: EntityMap | undefined
}
type DefaultMenuItem =
  | 'copy-paste'
  | 'show-details'
  | 'rename'
  | 'expand-collapse'
  | 'inherit'
  | 'delete'
  | 'export'
  | 'create-folder'
  | 'create-task'
  | 'open-viewer'
export type ContextMenuItemConstructor = (
  e: ContextEvent,
  cell: TableCellContextData,
  selectedCells: TableCellContextData[],
  meta: {
    selectedCells: string[] // minus row selection cells
    selectedRows: string[]
    selectedColumns: string[]
    selectedFullRows: string[] // if the full row is selected
    selectedGroups: string[] // groups if any
  },
  context: {
    history: UseHistoryReturn
  },
) => ContextMenuItemType | ContextMenuItemType[] | undefined
export type ContextMenuItemConstructors = (DefaultMenuItem | ContextMenuItemConstructor)[]

type CellContextMenuProps = {
  attribs: ProjectTableAttribute[]
  columns?: ColumnDef<TableRow>[]
  headerLabels: HeaderLabel[]
  onOpenNew?: (type: 'folder' | 'task') => void
  contextMenuItems?: ContextMenuItemConstructors
}

const useCellContextMenu = ({
  attribs,
  headerLabels = [],
  onOpenNew,
  contextMenuItems: propsContextMenuItems,
}: CellContextMenuProps) => {
  const { projectName } = useProjectContext()
  // context hooks
  const {
    showHierarchy,
    getEntityById,
    toggleExpandAll,
    toggleExpands,
    expanded,
    contextMenuItems: contextContextMenuItems = [],
    powerpack,
    onOpenPlayer,
  } = useProjectTableContext()

  // Merge context menu items from props and context
  const contextMenuItems = useMemo(
    () => [...contextContextMenuItems, ...(propsContextMenuItems || [])],
    [contextContextMenuItems, propsContextMenuItems],
  )
  const { canWriteLabelPermission, canWriteNamePermission } = useProjectDataContext()
  const { copyToClipboard, exportCSV, pasteFromClipboard } = useClipboard()
  const { selectedCells, clearSelection, selectCell, focusCell } = useSelectionCellsContext()
  const { inheritFromParent, history, setEditingCellId } = useCellEditing()

  // update entity context

  // data mutations
  const deleteEntities = useDeleteEntities({})

  const [cellContextMenuShow] = useCreateContextMenu([], powerpack)

  // Helper function to identify attributes that can be inherited
  const getEntitiesToInherit = (selected: string[]): InheritFromParentEntity[] => {
    return selected.reduce((acc, cellId) => {
      const { rowId, colId } = parseCellId(cellId) || {}
      if (!rowId || !colId || !colId.startsWith('attrib_')) return acc

      const entity = getEntityById(rowId)
      if (!entity) return acc
      const entityId = entity.entityId || entity.id

      const attribName = colId.replace('attrib_', '')
      //   get attrib model
      const attribModel = attribs.find((attrib) => attrib.name === attribName)
      // is the attrib inheritable?
      const isInheritable = attribModel?.data.inherit

      // Check if this attribute is owned by the entity (not inherited)
      if (entity.ownAttrib?.includes(attribName) && isInheritable) {
        // Find existing entry or create new one
        const existingIndex = acc.findIndex((item) => item.entityId === entityId)

        if (existingIndex >= 0) {
          // Add to existing entity's attribs if not already there
          if (!acc[existingIndex].attribs.includes(attribName)) {
            acc[existingIndex].attribs.push(attribName)
          }
        } else {
          // Create new entity entry
          acc.push({
            rowId: entityId,
            entityId: entityId,
            entityType: 'folderId' in entity ? 'task' : 'folder',
            attribs: [attribName],
            ownAttrib: entity.ownAttrib || [],
            // @ts-ignore
            folderId: entity.parentId ?? entity.folderId,
          })
        }
      }

      return acc
    }, [] as InheritFromParentEntity[])
  }

  const copyAndPasteItems: ContextMenuItemConstructor = (e, cell, selected, meta) => {
    return [
      {
        label: 'Copy',
        icon: 'content_copy',
        shortcut: getPlatformShortcutKey('c', [KeyMode.Ctrl]),
        command: () => copyToClipboard(meta.selectedCells),
        hidden: cell.isGroup || cell.columnId === 'thumbnail',
      },
      {
        label: `Copy row${meta.selectedFullRows.length > 1 ? 's' : ''}`,
        icon: 'content_copy',
        command: () => copyToClipboard(meta.selectedFullRows, true),
        hidden:
          cell.columnId !== 'name' ||
          !meta.selectedFullRows.some(
            (cellId) => parseCellId(cellId)?.rowId === parseCellId(cell.cellId)?.rowId,
          ),
      },
      {
        label: 'Paste',
        icon: 'content_paste',
        shortcut: getPlatformShortcutKey('v', [KeyMode.Ctrl]),
        command: () => pasteFromClipboard(meta.selectedCells),
        hidden: cell.columnId === 'name' || cell.columnId === 'thumbnail' || cell.isGroup,
        disabled: cell.attribField?.readOnly,
      },
    ]
  }

  const showDetailsItem: ContextMenuItemConstructor = (e, cell, selected, meta) => ({
    label: 'Show details',
    icon: 'dock_to_left',
    shortcut: 'Double click',
    command: () => {
      const rowSelectionCellId = getCellId(cell.entityId, ROW_SELECTION_COLUMN_ID)
      // select the row to open the details
      selectCell(rowSelectionCellId, false, false)
    },
    hidden:
      cell.columnId !== 'name' ||
      meta.selectedRows.length > 1 ||
      cell.isGroup ||
      isEntityRestricted(cell.entityType),
  })

  const openViewerItem: ContextMenuItemConstructor = (e, cell, selected, meta) => ({
    label: 'Open in viewer',
    icon: 'play_circle',
    shortcut: 'Spacebar',
    command: () => {
      if (onOpenPlayer) {
        const entity = getEntityById(cell.entityId)
        if (entity) {
          const targetIds = getEntityViewierIds(entity)
          onOpenPlayer(targetIds, { quickView: true })
        }
      }
    },
    hidden:
      (cell.columnId !== 'thumbnail' && cell.columnId !== 'name') ||
      cell.isGroup ||
      cell.entityType === 'unknown',
  })

  const expandCollapseChildrenItems: ContextMenuItemConstructor = (e, cell, selected, meta) => [
    {
      label: 'Expand children',
      icon: 'expand_all',
      shortcut: getPlatformShortcutKey('click', [KeyMode.Alt]),
      command: () => toggleExpandAll(meta.selectedRows, true),
      hidden: cell.columnId !== 'name' || cell.entityType !== 'folder',
    },
    {
      label: 'Collapse children',
      icon: 'collapse_all',
      shortcut: getPlatformShortcutKey('click', [KeyMode.Alt]),
      command: () => toggleExpandAll(meta.selectedRows, false),
      hidden: cell.columnId !== 'name' || cell.entityType !== 'folder',
    },
    {
      label: 'Expand',
      icon: 'expand_all',
      command: () => toggleExpands(meta.selectedRows, true),
      hidden:
        cell.columnId !== 'name' ||
        !cell.isGroup ||
        expanded[cell.entityId as keyof typeof expanded],
    },
    {
      label: 'Collapse',
      icon: 'collapse_all',
      command: () => toggleExpands(meta.selectedRows, false),
      hidden:
        cell.columnId !== 'name' ||
        !cell.isGroup ||
        !expanded[cell.entityId as keyof typeof expanded],
    },
  ]

  const deleteItem: ContextMenuItemConstructor = (e, cell, selected, meta) => ({
    label: 'Delete',
    icon: 'delete',
    danger: true,
    command: () => deleteEntities(meta.selectedRows),
    hidden: cell.columnId !== 'name' || cell.isGroup,
  })

  const inheritItem: ContextMenuItemConstructor = (e, cell, selected, meta) => {
    const entitiesToInherit = getEntitiesToInherit(meta.selectedCells)
    const canInheritFromParent =
      entitiesToInherit.length > 0 &&
      showHierarchy &&
      !(meta.selectedRows.length > 1 && meta.selectedColumns.length > 1)

    return {
      label: 'Inherit from parent',
      icon: 'disabled_by_default',
      command: () => inheritFromParent(entitiesToInherit),
      hidden: !canInheritFromParent,
    }
  }

  const exportItem: ContextMenuItemConstructor = (e, cell) => ({
    label: 'Export selection',
    icon: 'download',
    command: () => exportCSV(Array.from(selectedCells), projectName),
    hidden: cell.isGroup,
  })

  const createFolderItems: ContextMenuItemConstructor = (e, cell) => [
    {
      label: 'Create folder',
      icon: 'create_new_folder',
      command: () => onOpenNew?.('folder'),
      hidden: cell.columnId !== 'name' || !showHierarchy || !onOpenNew,
    },
    {
      label: 'Create root folder',
      icon: 'create_new_folder',
      command: () => {
        clearSelection()
        onOpenNew?.('folder')
      },
      hidden: cell.columnId !== 'name' || !showHierarchy || !onOpenNew,
    },
  ]

  const createTaskItem: ContextMenuItemConstructor = (e, cell) => ({
    label: 'Create task',
    icon: 'add_task',
    command: () => onOpenNew?.('task'),
    hidden: cell.columnId !== 'name' || !showHierarchy || !onOpenNew,
  })

  const renameItem: ContextMenuItemConstructor = (e, cell) => ({
    label: 'Rename',
    icon: 'titlecase',
    shortcut: 'R',
    command: () => {
      const nameCellId = getCellId(cell.entityId, 'name')
      setEditingCellId(nameCellId)
    },
    hidden:
      cell.columnId !== 'name' ||
      cell.isGroup ||
      (cell.entityType !== 'folder' && cell.entityType !== 'task'),
    disabled: !(canWriteNamePermission || canWriteLabelPermission),
  })

  const builtInMenuItems: Record<DefaultMenuItem, ContextMenuItemConstructor> = {
    ['copy-paste']: copyAndPasteItems,
    ['show-details']: showDetailsItem,
    ['rename']: renameItem,
    ['expand-collapse']: expandCollapseChildrenItems,
    ['delete']: deleteItem,
    ['inherit']: inheritItem,
    ['export']: exportItem,
    ['create-folder']: createFolderItems,
    ['create-task']: createTaskItem,
    ['open-viewer']: openViewerItem,
  }

  const getCellData = (cellId: string): TableCellContextData | undefined => {
    const { rowId, colId } = parseCellId(cellId) || {}
    if (!rowId || !colId) return undefined
    const cellEntityData = getEntityById(rowId)
    const attribField = attribs.find((attrib) => attrib.name === colId?.replace('attrib_', ''))
    const column = headerLabels.find((header) => header.id === colId)
    const parentId = cellEntityData
      ? 'parentId' in cellEntityData
        ? cellEntityData.parentId
        : 'folderId' in cellEntityData
        ? cellEntityData.folderId
        : undefined
      : undefined
    return {
      cellId: cellId,
      columnId: colId,
      entityId: cellEntityData?.entityId || cellEntityData?.id || rowId,
      entityType: cellEntityData?.entityType,
      parentId: parentId,
      attribField: attribField,
      isGroup: rowId.startsWith(GROUP_BY_ID),
      column: {
        id: colId,
        label: column?.label || '',
      },
      data: cellEntityData,
    }
  }

  const handleTableBodyContextMenu = (e: ContextEvent) => {
    const target = e.target as HTMLElement
    const tdEl = target.closest('td')
    // get id of first child of td
    const cellId = tdEl?.firstElementChild?.id

    if (!cellId) return

    const cellData = getCellData(cellId)

    if (!cellData) return

    let currentSelectedCells = Array.from(selectedCells)
    // if selecting a cell outside of the current selection
    if (!currentSelectedCells.includes(cellId) || !currentSelectedCells.length) {
      currentSelectedCells = [cellId]
      // update selection
      selectCell(cellId, false, false)
      focusCell(cellId)
    }
    // selected cells without row selection cells
    const selectedRealCells = currentSelectedCells.filter(
      (id) => parseCellId(id)?.colId !== ROW_SELECTION_COLUMN_ID,
    )

    const selectedCellsData = currentSelectedCells.flatMap((cellId) => getCellData(cellId) || [])

    // Remove duplicates based on entityId - prioritize full row selection over individual cells
    const filteredSelectedCellsData = [
      ...new Map(selectedCellsData.map((e) => [e.entityId, e])).values(),
    ]

    const selectedCellRows: string[] = []
    const selectedCellColumns: string[] = []
    const selectedCellFullRows: string[] = []
    const selectedCellsGroups: string[] = [] // find cells that are group headers
    for (const { entityId, columnId } of filteredSelectedCellsData) {
      if (entityId && !selectedCellRows.includes(entityId)) selectedCellRows.push(entityId)
      if (columnId && !selectedCellColumns.includes(columnId)) selectedCellColumns.push(columnId)
      if (columnId === ROW_SELECTION_COLUMN_ID && !selectedCellFullRows.includes(entityId))
        selectedCellFullRows.push(entityId)
      if (entityId.startsWith(GROUP_BY_ID)) selectedCellsGroups.push(entityId)
    }

    const constructedMenuItems = contextMenuItems.flatMap((constructor) =>
      typeof constructor === 'function'
        ? constructor(
            e,
            cellData,
            filteredSelectedCellsData,
            {
              selectedCells: selectedRealCells, // selected cells without row selection
              selectedRows: selectedCellRows,
              selectedColumns: selectedCellColumns,
              selectedFullRows: selectedCellFullRows,
              selectedGroups: selectedCellsGroups, // groups if any
            },
            {
              history,
            },
          )
        : builtInMenuItems[constructor]?.(
            e,
            cellData,
            filteredSelectedCellsData,
            {
              selectedCells: selectedRealCells, // selected cells without row selection
              selectedRows: selectedCellRows,
              selectedColumns: selectedCellColumns,
              selectedFullRows: selectedCellFullRows,
              selectedGroups: selectedCellsGroups, // groups if any
            },
            { history },
          ),
    )

    cellContextMenuShow(e, constructedMenuItems)
  }

  return { handleTableBodyContextMenu }
}

export default useCellContextMenu
