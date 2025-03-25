import useCreateContext from '@hooks/useCreateContext'
import useDeleteEntities from './useDeleteEntities'
import { getPlatformShortcutKey, KeyMode } from '@helpers/platform'
import { getCellId, parseCellId } from '../utils/cellUtils'
import { useClipboard } from '../context/ClipboardContext'
import { ROW_SELECTION_COLUMN_ID, useSelection } from '../context/SelectionContext'
import { useProjectTableContext } from '../context/ProjectTableContext'
import { useCellEditing } from '../context/CellEditingContext'
import { useNewEntityContext } from '@context/NewEntityContext'
import { AttributeModel } from '@api/rest/attributes'

type ContextEvent = React.MouseEvent<HTMLTableSectionElement, MouseEvent>

type CellContextMenuProps = {
  attribs: AttributeModel[]
}

const useCellContextMenu = ({ attribs }: CellContextMenuProps) => {
  // context hooks
  const { projectInfo, projectName, showHierarchy, getEntityById, toggleExpandAll } =
    useProjectTableContext()
  const { copyToClipboard, exportCSV, pasteFromClipboard } = useClipboard()
  const { isCellSelected, selectedCells, clearSelection, selectCell } = useSelection()
  const { inheritFromParent } = useCellEditing()
  const { onOpenNew } = useNewEntityContext()

  // update entity context

  // data mutations
  const deleteEntities = useDeleteEntities({})

  const [cellContextMenuShow] = useCreateContext()

  const cellContextMenuItems = (_e: ContextEvent, id: string, selected: string[]) => {
    // Define menu item type with condition
    type MenuItem = {
      label: string
      icon: string
      shortcut?: string
      danger?: boolean
      command: () => void
      shouldShow: boolean
    }

    // Parse cell info
    const { rowId: entityId, colId } = parseCellId(id) || {}
    if (!entityId)
      return [
        {
          label: 'Copy',
          icon: 'content_copy',
          shortcut: getPlatformShortcutKey('c', [KeyMode.Ctrl]),
          command: () => copyToClipboard(selected),
          shouldShow: true,
        },
      ]

    // Define conditions
    const isNameColumn = colId === 'name'
    const isSingleSelection = selected.length === 1
    const entitiesToInherit = getEntitiesToInherit(selected)

    // from the selected cells, get the rows they are selected in
    const selectedCellRows = Array.from(
      new Set(selected.map((cellId) => parseCellId(cellId)?.rowId).filter(Boolean) as string[]),
    )
    // get selected rows ids
    const selectedRowCells = Array.from(selectedCells).filter(
      (cellId) => parseCellId(cellId)?.colId === ROW_SELECTION_COLUMN_ID,
    )
    const canInheritFromParent = entitiesToInherit.length > 0 && showHierarchy

    // Define all possible menu items with their conditions
    const allMenuItems: MenuItem[] = [
      // Clipboard operations
      {
        label: 'Copy',
        icon: 'content_copy',
        shortcut: getPlatformShortcutKey('c', [KeyMode.Ctrl]),
        command: () => copyToClipboard(selected),
        shouldShow: true, // Always shown
      },
      {
        label: `Copy row${selectedRowCells.length > 1 ? 's' : ''}`,
        icon: 'content_copy',
        command: () => copyToClipboard(selectedRowCells, true),
        shouldShow:
          isNameColumn &&
          selectedRowCells.some((cellId) => parseCellId(cellId)?.rowId === parseCellId(id)?.rowId),
      },
      {
        label: 'Paste',
        icon: 'content_paste',
        shortcut: getPlatformShortcutKey('v', [KeyMode.Ctrl]),
        command: () => pasteFromClipboard(selected),
        shouldShow: !isNameColumn,
      },
      // Entity operations
      {
        label: 'Show details',
        icon: 'dock_to_left',
        shortcut: 'Double click',
        command: () => {
          const rowSelectionCellId = getCellId(entityId, ROW_SELECTION_COLUMN_ID)
          selectCell(rowSelectionCellId, false, false)
        },
        shouldShow: isNameColumn && isSingleSelection,
      },

      // Expand/collapse (all) operations - only for name column
      {
        label: 'Expand all',
        icon: 'expand_all',
        shortcut: 'Alt + click',
        command: () => toggleExpandAll(selectedCellRows, true),
        shouldShow: isNameColumn,
      },
      {
        label: 'Collapse all',
        icon: 'collapse_all',
        shortcut: 'Alt + click',
        command: () => toggleExpandAll(selectedCellRows, false),
        shouldShow: isNameColumn,
      },

      // Attribute operations
      {
        label: 'Inherit from parent',
        icon: 'disabled_by_default',
        command: () => inheritFromParent(entitiesToInherit),
        shouldShow: canInheritFromParent,
      },

      // Export operations
      {
        label: 'Export selection',
        icon: 'download',
        command: () => exportCSV(selected, projectName),
        shouldShow: true, // Always shown
      },

      // Creation operations (only in name column and hierarchy mode)
      {
        label: 'Create folder',
        icon: 'create_new_folder',
        command: () => onOpenNew('folder', projectInfo),
        shouldShow: isNameColumn && showHierarchy,
      },
      {
        label: 'Create root folder',
        icon: 'create_new_folder',
        command: () => {
          clearSelection()
          onOpenNew('folder', projectInfo)
        },
        shouldShow: isNameColumn && showHierarchy,
      },
      {
        label: 'Create task',
        icon: 'add_task',
        command: () => onOpenNew('task', projectInfo),
        shouldShow: isNameColumn && showHierarchy,
      },

      // Destructive operations
      {
        label: 'Delete',
        icon: 'delete',
        danger: true,
        command: () => deleteEntities(selected),
        shouldShow: isNameColumn,
      },
    ]

    // Filter items based on their conditions
    return allMenuItems.filter((item) => item.shouldShow).map(({ shouldShow, ...item }) => item)
  }

  // Helper function to identify attributes that can be inherited
  const getEntitiesToInherit = (selected: string[]) => {
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
        const existingIndex = acc.findIndex((item) => item.id === rowId)

        if (existingIndex >= 0) {
          // Add to existing entity's attribs if not already there
          if (!acc[existingIndex].attribs.includes(attribName)) {
            acc[existingIndex].attribs.push(attribName)
          }
        } else {
          // Create new entity entry
          acc.push({
            id: rowId,
            type: 'folderId' in entity ? 'task' : 'folder',
            attribs: [attribName],
          })
        }
      }

      return acc
    }, [] as { id: string; type: string; attribs: string[] }[])
  }

  const handleTableBodyContextMenu = (e: ContextEvent) => {
    const target = e.target as HTMLElement
    const tdEl = target.closest('td')
    // get id of first child of td
    const cellId = tdEl?.firstElementChild?.id

    if (cellId) {
      let currentSelectedCells = Array.from(selectedCells)
      if (!isCellSelected(cellId)) {
        currentSelectedCells = [cellId]
      }
      cellContextMenuShow(e, cellContextMenuItems(e, cellId, currentSelectedCells))
    }
  }

  return { handleTableBodyContextMenu }
}

export default useCellContextMenu
