import { useMemo, useRef } from 'react'
import { TablePanel, Section } from '@ynput/ayon-react-components'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useEffect } from 'react'
import { ContextMenu } from 'primereact/contextmenu'
import ContextMenuItem from '../components/ContextMenuItem'

const TeamList = ({
  teams,
  isLoading,
  selection,
  onSelect,
  onRowClick,
  showNull,
  footer,
  style,
  styleSection,
  className,
  onNoProject,
  onSuccess,
  autoSelect,
  onDelete,
  onNewTeam,
  onDuplicate,
}) => {
  // if selection does not exist in data, set selection to null
  useEffect(() => {
    if (isLoading) return

    if (onNoProject && !teams.map((project) => project.name).includes(selection)) {
      console.log('selected project does not exist: ', selection)
      const defaultProject = autoSelect ? teams[0]?.name : null
      onNoProject(defaultProject)
    } else if (onSuccess) onSuccess()
  }, [selection, teams, onNoProject, isLoading])

  const teamList = [...teams].sort((a, b) => a.name.localeCompare(b.name))

  if (showNull) teamList.unshift({ name: '_' })

  const selectionObj = useMemo(() => {
    let result = []
    for (const project of teamList) {
      if (selection === null) {
        if (project.name === '_') {
          result.push(project)
          break
        }
      }
      if (selection?.includes(project.name)) result.push(project)
    }
    return result
  }, [selection, teamList])

  const onSelectionChange = (e) => {
    let result = []
    for (const node of e.value) {
      result.push(node.name)
    }
    onSelect(result)
  } // onSelectionChange

  // Context menu outside of table items
  const globalContextMenuRef = useRef(null)

  const globalContextMenuModel = useMemo(() => {
    const menuItems = [
      {
        label: 'Create Team',
        icon: 'group_add',
        command: onNewTeam,
      },
    ]
    return menuItems.map((item) => ({
      template: (
        <ContextMenuItem key={item.label} contextMenuRef={globalContextMenuRef} {...item} />
      ),
    }))
  }, [teams])

  const tableContextMenuRef = useRef(null)
  // Context menu outside of table items
  const tableContextMenuModel = useMemo(() => {
    const menuItems = [
      {
        label: 'Create Team',
        icon: 'group_add',
        command: onNewTeam,
      },
      {
        label: 'Duplicate Team',
        icon: 'content_copy',
        command: onDuplicate,
        disabled: selection.length > 1,
      },
      {
        label: `Delete Team${selection.length > 1 ? 's' : ''}`,
        icon: 'delete',
        command: onDelete,
      },
    ]
    return menuItems.map((item) => ({
      template: <ContextMenuItem key={item.label} contextMenuRef={tableContextMenuRef} {...item} />,
    }))
  }, [teams, selection])

  const contextMenuRefs = useMemo(
    () => [tableContextMenuRef, globalContextMenuRef],
    [tableContextMenuRef, globalContextMenuRef],
  )

  const handleContext = (e, id) => {
    // show context menu and hide others
    contextMenuRefs.forEach((ref) =>
      ref?.current?.props?.id !== id ? ref.current?.hide() : ref.current?.show(e),
    )
  }
  const onContextMenuSelectionChange = (event) => {
    if (!selection.includes(event.value.name)) {
      onSelect(event.value.name)
    }
  }

  return (
    <>
      <ContextMenu model={globalContextMenuModel} ref={globalContextMenuRef} id="global" />
      <Section style={{ minWidth: 200, maxWidth: 200, ...styleSection }} className={className}>
        {footer}
        <TablePanel loading={isLoading} onContextMenu={(e) => handleContext(e, 'global')}>
          <ContextMenu model={tableContextMenuModel} ref={tableContextMenuRef} id="table" />
          <DataTable
            value={teamList}
            scrollable="true"
            scrollHeight="flex"
            selectionMode={'multiple'}
            responsive="true"
            dataKey="name"
            selection={selectionObj}
            onSelectionChange={onSelect && onSelectionChange}
            onRowClick={onRowClick}
            onContextMenu={(e) => handleContext(e.originalEvent, 'table')}
            onContextMenuSelectionChange={onContextMenuSelectionChange}
          >
            <Column field="name" header="Team" style={{ minWidth: 150, ...style }} />
          </DataTable>
        </TablePanel>
      </Section>
    </>
  )
}

export default TeamList
