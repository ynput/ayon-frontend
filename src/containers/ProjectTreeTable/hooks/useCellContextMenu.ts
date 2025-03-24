import useCreateContext from '@hooks/useCreateContext'
import useDeleteEntities from './useDeleteEntities'
import { getPlatformShortcutKey, KeyMode } from '@helpers/platform'
import { getCellId, parseCellId } from '../utils/cellUtils'
import { useClipboard } from '../context/ClipboardContext'
import { ROW_SELECTION_COLUMN_ID, useSelection } from '../context/SelectionContext'
import { useProjectTableContext } from '../context/ProjectTableContext'
import { useCellEditing } from '../context/CellEditingContext'
import { NewEntityType, useNewEntityContext } from '@context/NewEntityContext'

type ContextEvent = React.MouseEvent<HTMLTableSectionElement, MouseEvent>

const useCellContextMenu = () => {
  // context hooks
  const { projectInfo, projectName, showHierarchy, getEntityById } = useProjectTableContext()
  const { copyToClipboard, exportCSV, pasteFromClipboard } = useClipboard()
  const { isCellSelected, selectedCells, clearSelection, selectCell } = useSelection()
  const { inheritFromParent } = useCellEditing()
  const { onOpenNew } = useNewEntityContext()

  // update entity context

  // data mutations
  const deleteEntities = useDeleteEntities({})

  const [cellContextMenuShow] = useCreateContext()

  const cellContextMenuItems = (_e: ContextEvent, id: string, selected: string[]) => {
    const items: {
      label: string
      icon: string
      shortcut?: string
      danger?: boolean
      command: () => void
    }[] = [
      {
        label: 'Copy',
        icon: 'content_copy',
        shortcut: getPlatformShortcutKey('c', [KeyMode.Ctrl]),
        command: () => copyToClipboard(selected),
      },
    ]

    // get the entity
    const entityId = parseCellId(id)?.rowId
    if (!entityId) return items

    const isColName = parseCellId(id)?.colId === 'name'

    if (!isColName) {
      items.push({
        label: 'Paste',
        icon: 'content_paste',
        shortcut: getPlatformShortcutKey('v', [KeyMode.Ctrl]),
        command: () => pasteFromClipboard(selected),
      })
    } else {
      if (selected.length === 1) {
        items.push({
          label: 'Show details',
          icon: 'dock_to_left',
          shortcut: 'Double click',
          command: () => {
            const rowSelectionCellId = getCellId(entityId, ROW_SELECTION_COLUMN_ID)
            selectCell(rowSelectionCellId, false, false)
          },
        })
      }
    }

    const entitiesToInherit = selected.reduce((acc, cellId) => {
      const { rowId, colId } = parseCellId(cellId) || {}
      if (!rowId || !colId || !colId.startsWith('attrib_')) return acc

      const entity = getEntityById(rowId)
      if (!entity) return acc

      const attribName = colId.replace('attrib_', '')

      // Check if this attribute is owned by the entity (not inherited)
      if (entity.ownAttrib?.includes(attribName)) {
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

    // Update the inherit from parent command to use the entities we collected
    if (entitiesToInherit.length && showHierarchy) {
      // NOTE: This should work not in hierarchy mode, but for some reason it doesn't
      items.push({
        label: 'Inherit from parent',
        icon: 'disabled_by_default',
        command: () => inheritFromParent(entitiesToInherit),
      })
    }

    items.push({
      label: 'Export selection',
      icon: 'download',
      command: () => exportCSV(selected, projectName),
    })

    const openNewEntity = (type: NewEntityType) => onOpenNew(type, projectInfo)

    if (isColName) {
      if (showHierarchy) {
        items.push({
          label: 'Create folder',
          icon: 'create_new_folder',
          command: () => openNewEntity('folder'),
        })

        items.push({
          label: 'Create root folder',
          icon: 'create_new_folder',
          command: () => {
            // deselect all
            clearSelection()
            openNewEntity('folder')
          },
        })

        items.push({
          label: 'Create task',
          icon: 'add_task',
          command: () => openNewEntity('task'),
        })
      }

      items.push({
        label: 'Delete',
        icon: 'delete',
        danger: true,
        command: () => deleteEntities(selected),
      })
    }

    return items
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
