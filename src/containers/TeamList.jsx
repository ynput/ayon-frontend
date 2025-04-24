import { useMemo } from 'react'
import { TablePanel, Section } from '@ynput/ayon-react-components'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useEffect } from 'react'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import clsx from 'clsx'
import useTableLoadingData from '@hooks/useTableLoadingData'

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

  const onContextMenuSelectionChange = (event) => {
    if (!selection.includes(event.value.name)) {
      onSelect(event.value.name)
    }
  }

  // GLOBAL CONTEXT MENU
  const globalContextItems = useMemo(
    () => [
      {
        label: 'Create Team',
        icon: 'group_add',
        command: onNewTeam,
      },
    ],
    [onNewTeam],
  )
  // create the ref and model
  const [globalContextMenuShow] = useCreateContextMenu(globalContextItems)

  // TABLE CONTEXT MENU
  const tableContextItems = useMemo(
    () => [
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
        danger: true,
      },
    ],
    [teams, selection],
  )
  // create the ref and model
  const [tableContextMenuShow] = useCreateContextMenu(tableContextItems)

  const tableData = useTableLoadingData(teamList, isLoading, 10, 'name')

  return (
    <>
      <Section style={{ minWidth: 150, maxWidth: 200, ...styleSection }} className={className}>
        {footer}
        <TablePanel onContextMenu={globalContextMenuShow}>
          <DataTable
            value={tableData}
            scrollable="true"
            scrollHeight="flex"
            selectionMode={'multiple'}
            responsive="true"
            dataKey="name"
            selection={selectionObj}
            onSelectionChange={onSelect && onSelectionChange}
            onRowClick={onRowClick}
            onContextMenu={(e) => tableContextMenuShow(e.originalEvent)}
            onContextMenuSelectionChange={onContextMenuSelectionChange}
            className={clsx({ loading: isLoading })}
            rowClassName={(rowData) => clsx({ loading: rowData.isLoading })}
            emptyMessage="No teams found"
          >
            <Column field="name" header="Team" style={{ minWidth: 150, ...style }} />
          </DataTable>
        </TablePanel>
      </Section>
    </>
  )
}

export default TeamList
