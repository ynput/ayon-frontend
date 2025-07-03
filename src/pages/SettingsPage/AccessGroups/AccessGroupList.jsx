import { useState, useMemo } from 'react'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button, TablePanel, Section, Toolbar, Spacer } from '@ynput/ayon-react-components'
import { useGetAccessGroupsQuery } from '@queries/accessGroups/getAccessGroups'
import { useDeleteAccessGroupMutation } from '@queries/accessGroups/updateAccessGroups'
import NewAccessGroup from './NewAccessGroup'
import { confirmDelete } from '@shared/util'
import clsx from 'clsx'
import useTableLoadingData from '@hooks/useTableLoadingData'

const AccessGroupList = ({
  projectName,
  selectedAccessGroup,
  onSelectAccessGroup,
  canCreateOrDelete,
}) => {
  const [showNewAccessGroup, setShowNewAccessGroup] = useState(false)

  // Load user list
  const { data: accessGroupList = [], isLoading } = useGetAccessGroupsQuery({
    projectName: projectName || '_',
  })

  const [deleteAccessGroup] = useDeleteAccessGroupMutation()

  // Selection
  const selection = useMemo(() => {
    for (const accessGroup of accessGroupList) {
      if (accessGroup.name === selectedAccessGroup?.name) return accessGroup
    }
  }, [selectedAccessGroup, accessGroupList])

  const onSelectionChange = (eValue) => {
    if (!onSelectAccessGroup) return
    onSelectAccessGroup({
      name: eValue.name,
      isProjectLevel: eValue.isProjectLevel,
    })
  }

  const onNewAccessGroup = (name) => {
    // close form
    setShowNewAccessGroup(false)
    // select new access group
    onSelectAccessGroup({ name, isProjectLevel: true })
  }

  // FIXME: this doesn't update when access group details updates
  const getRowClass = (rowData) => {
    return { 'changed-project': rowData.isProjectLevel, loading: isLoading }
  }

  // Render

  const globalGroupPayload = {
    label: 'Access group',
    accept: async () =>
      await deleteAccessGroup({ accessGroupName: selection.name, projectName: '_' }).unwrap(),
    message: 'Are you sure you want to delete this access group ?',
  }

  const onDeleteGlobal = async () => confirmDelete(globalGroupPayload)

  const onContextMenu = (event) => {
    const eventData = event?.data
    onSelectionChange(eventData)
    ctxMenuShow(event.originalEvent, ctxMenuItems(eventData))
  }

  const ctxMenuItems = (eventData) => {
    const menuItems = [
      {
        label: 'Clear Overrides',
        icon: 'clear',
        disabled: !eventData.isProjectLevel,
        command: async () =>
          confirmDelete({
            header: 'Clear project overrides',
            deleteLabel: 'Clear',
            label: 'Project overrides',
            accept: async () =>
              await deleteAccessGroup({ accessGroupName: eventData.name, projectName }).unwrap(),
            message:
              'Are you sure you want to delete all project override settings for this access group?',
          }),
      },
      {
        label: 'Delete',
        icon: 'delete',
        command: async () =>
          confirmDelete({
            label: 'Access group',
            accept: async () =>
              await deleteAccessGroup({
                accessGroupName: eventData.name,
                projectName: '_',
              }).unwrap(),
            message: 'Are you sure you want to delete this access group ?',
          }),
        danger: true,
      },
    ]
    return menuItems
  }

  const [ctxMenuShow] = useCreateContextMenu([])

  const tableData = useTableLoadingData(accessGroupList, isLoading, 5, 'name')

  return (
    <Section style={{ maxWidth: 400, flex: 2 }}>
      {showNewAccessGroup && (
        <NewAccessGroup onClose={onNewAccessGroup} accessGroupList={accessGroupList} />
      )}

      {canCreateOrDelete && (
        <Toolbar>
          <Button
            label="New access group"
            onClick={() => setShowNewAccessGroup(true)}
            icon="group_add"
          />
          <Spacer />
          <Button label="Delete access group" onClick={onDeleteGlobal} icon="delete" />
        </Toolbar>
      )}

      <TablePanel>
        <DataTable
          value={tableData}
          scrollable="true"
          scrollHeight="flex"
          dataKey="name"
          selectionMode="single"
          selection={selection}
          onSelectionChange={(e) => onSelectionChange(e.value)}
          rowClassName={getRowClass}
          className={clsx({ loading: isLoading })}
          onContextMenu={(e) => onContextMenu(e)}
        >
          <Column field="name" header="Access group" />
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default AccessGroupList
