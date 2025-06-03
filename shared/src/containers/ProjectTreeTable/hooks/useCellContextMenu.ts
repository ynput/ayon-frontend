import { ContextMenuItemType, useCreateContextMenu } from '../../ContextMenu/useCreateContextMenu'
import useDeleteEntities from './useDeleteEntities'
import { getPlatformShortcutKey, KeyMode } from '../../../util/platform'
import { getCellId, parseCellId } from '../utils/cellUtils'
import { useClipboard } from '../context/ClipboardContext'
import { ROW_SELECTION_COLUMN_ID, useSelectionCellsContext } from '../context/SelectionCellsContext'
import { useProjectTableContext } from '../context/ProjectTableContext'
import { useCellEditing } from '../context/CellEditingContext'
import { InheritFromParentEntity } from './useUpdateTableData'
import { ProjectTableAttribute } from '../types'
import { UseHistoryReturn } from './useHistory'

type ContextEvent = React.MouseEvent<HTMLTableSectionElement, MouseEvent>

export type TableCellContextData = {
  entityId: string
  cellId: string
  columnId: string
  entityType: 'folder' | 'task' | 'product' | 'version' | undefined
  attribField: ProjectTableAttribute | undefined
}
type DefaultMenuItem =
  | 'copy-paste'
  | 'show-details'
  | 'expand-collapse'
  | 'inherit'
  | 'delete'
  | 'export'
  | 'create-folder'
  | 'create-task'
export type ContextMenuItemConstructor = (
  e: ContextEvent,
  cell: TableCellContextData,
  selectedCells: TableCellContextData[],
  meta: {
    selectedCells: string[] // minus row selection cells
    selectedRows: string[]
    selectedColumns: string[]
    selectedFullRows: string[] // if the full row is selected
  },
  context: {
    history: UseHistoryReturn
  },
) => ContextMenuItemType | ContextMenuItemType[] | undefined
export type ContextMenuItemConstructors = (DefaultMenuItem | ContextMenuItemConstructor)[]

type CellContextMenuProps = {
  attribs: ProjectTableAttribute[]
  onOpenNew?: (type: 'folder' | 'task') => void
}

const useCellContextMenu = ({ attribs, onOpenNew }: CellContextMenuProps) => {
  // context hooks
  const {
    projectName,
    showHierarchy,
    getEntityById,
    toggleExpandAll,
    contextMenuItems = [],
  } = useProjectTableContext()
  const { copyToClipboard, exportCSV, pasteFromClipboard } = useClipboard()
  const { selectedCells, clearSelection, selectCell, focusCell } = useSelectionCellsContext()
  const { inheritFromParent, history } = useCellEditing()

  // update entity context

  // data mutations
  const deleteEntities = useDeleteEntities({})

  const [cellContextMenuShow] = useCreateContextMenu()

  // Helper function to identify attributes that can be inherited
  const getEntitiesToInherit = (selected: string[]): InheritFromParentEntity[] => {
    return selected.reduce((acc, cellId) => {
      const { rowId, colId } = parseCellId(cellId) || {}
      if (!rowId || !colId || !colId.startsWith('attrib_')) return acc

      const entity = getEntityById(rowId)
      if (!entity) return acc

      const attribName = colId.replace('attrib_', '')
      //   get attrib model
      const attribModel = attribs.find((attrib) => attrib.name === attribName)
      // is the attrib inheritable?
      const isInheritable = attribModel?.data.inherit

      // Check if this attribute is owned by the entity (not inherited)
      if (entity.ownAttrib?.includes(attribName) && isInheritable) {
        // Find existing entry or create new one
        const existingIndex = acc.findIndex((item) => item.entityId === rowId)

        if (existingIndex >= 0) {
          // Add to existing entity's attribs if not already there
          if (!acc[existingIndex].attribs.includes(attribName)) {
            acc[existingIndex].attribs.push(attribName)
          }
        } else {
          // Create new entity entry
          acc.push({
            rowId: rowId,
            entityId: rowId,
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

  const copyAndPasteItems: ContextMenuItemConstructor = (e, cell, selected, config) => {
    return [
      {
        label: 'Copy',
        icon: 'content_copy',
        shortcut: getPlatformShortcutKey('c', [KeyMode.Ctrl]),
        command: () => copyToClipboard(config.selectedCells),
        hidden: false, // Always shown
      },
      {
        label: `Copy row${config.selectedFullRows.length > 1 ? 's' : ''}`,
        icon: 'content_copy',
        command: () => copyToClipboard(config.selectedFullRows, true),
        hidden:
          cell.columnId !== 'name' ||
          !config.selectedFullRows.some(
            (cellId) => parseCellId(cellId)?.rowId === parseCellId(cell.cellId)?.rowId,
          ),
      },
      {
        label: 'Paste',
        icon: 'content_paste',
        shortcut: getPlatformShortcutKey('v', [KeyMode.Ctrl]),
        command: () => pasteFromClipboard(config.selectedCells),
        hidden: cell.columnId === 'name',
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
    hidden: cell.columnId !== 'name' || meta.selectedRows.length > 1,
  })

  const expandCollapseChildrenItems: ContextMenuItemConstructor = (e, cell, selected, meta) => [
    {
      label: 'Expand children',
      icon: 'expand_all',
      shortcut: 'Alt + click',
      command: () => toggleExpandAll(meta.selectedRows, true),
      hidden: cell.columnId !== 'name',
    },
    {
      label: 'Collapse children',
      icon: 'collapse_all',
      shortcut: 'Alt + click',
      command: () => toggleExpandAll(meta.selectedRows, false),
      hidden: cell.columnId !== 'name',
    },
  ]

  const deleteItem: ContextMenuItemConstructor = (e, cell, selected, meta) => ({
    label: 'Delete',
    icon: 'delete',
    danger: true,
    command: () => deleteEntities(meta.selectedRows),
    hidden: cell.columnId !== 'name',
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

  const exportItem: ContextMenuItemConstructor = () => ({
    label: 'Export selection',
    icon: 'download',
    command: () => exportCSV(Array.from(selectedCells), projectName),
    hidden: false, // Always shown
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

  const builtInMenuItems: Record<DefaultMenuItem, ContextMenuItemConstructor> = {
    ['copy-paste']: copyAndPasteItems,
    ['show-details']: showDetailsItem,
    ['expand-collapse']: expandCollapseChildrenItems,
    ['delete']: deleteItem,
    ['inherit']: inheritItem,
    ['export']: exportItem,
    ['create-folder']: createFolderItems,
    ['create-task']: createTaskItem,
  }

  const getCellData = (cellId: string): TableCellContextData | undefined => {
    const { rowId, colId } = parseCellId(cellId) || {}
    if (!rowId || !colId) return undefined
    const cellEntityData = getEntityById(rowId)
    const attribField = attribs.find((attrib) => attrib.name === colId?.replace('attrib_', ''))
    return {
      cellId: cellId,
      columnId: colId,
      entityId: cellEntityData?.entityId || rowId,
      entityType: cellEntityData?.entityType,
      attribField: attribField,
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
    const selectedCellRows: string[] = []
    const selectedCellColumns: string[] = []
    const selectedCellFullRows: string[] = []
    for (const { entityId, columnId } of selectedCellsData) {
      if (entityId && !selectedCellRows.includes(entityId)) selectedCellRows.push(entityId)
      if (columnId && !selectedCellColumns.includes(columnId)) selectedCellColumns.push(columnId)
      if (columnId === ROW_SELECTION_COLUMN_ID && !selectedCellFullRows.includes(entityId))
        selectedCellFullRows.push(entityId)
    }

    const constructedMenuItems = contextMenuItems.flatMap((constructor) =>
      typeof constructor === 'function'
        ? constructor(
            e,
            cellData,
            selectedCellsData,
            {
              selectedCells: selectedRealCells, // selected cells without row selection
              selectedRows: selectedCellRows,
              selectedColumns: selectedCellColumns,
              selectedFullRows: selectedCellFullRows,
            },
            {
              history,
            },
          )
        : builtInMenuItems[constructor]?.(
            e,
            cellData,
            selectedCellsData,
            {
              selectedCells: selectedRealCells, // selected cells without row selection
              selectedRows: selectedCellRows,
              selectedColumns: selectedCellColumns,
              selectedFullRows: selectedCellFullRows,
            },
            { history },
          ),
    )

    cellContextMenuShow(e, constructedMenuItems)
  }

  return { handleTableBodyContextMenu }
}

export default useCellContextMenu
