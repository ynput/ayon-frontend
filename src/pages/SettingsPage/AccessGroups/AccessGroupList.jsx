import { useState, useMemo } from 'react'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button, TablePanel, Section, Toolbar, Spacer } from '@ynput/ayon-react-components'
import { useDeleteAccessGroupMutation, useGetAccessGroupsQuery } from '@shared/api'
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
  // name of the access group being duplicated, opens the dialog in duplicate mode
  const [duplicateSource, setDuplicateSource] = useState(null)

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
    setDuplicateSource(null)
    // closed without creating anything
    if (!name) return
    // select new access group
    onSelectAccessGroup({ name, isProjectLevel: true })
  }

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
    ctxMenuShow(event.originalEvent, ctxMenuItems(eventData))
  }

  const ctxMenuItems = (eventData) => {
    const menuItems = [
      {
        label: 'Duplicate',
        icon: 'content_copy',
        hidden: !canCreateOrDelete,
        command: () => setDuplicateSource(eventData.name),
      },
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
    return menuItems.filter((item) => !item.hidden)
  }

  const [ctxMenuShow] = useCreateContextMenu([])

  const tableData = useTableLoadingData(accessGroupList, isLoading, 5, 'name')

  return (
    <Section style={{ maxWidth: 400, flex: 2 }}>
      {(showNewAccessGroup || duplicateSource) && (
        <NewAccessGroup
          onClose={onNewAccessGroup}
          accessGroupList={accessGroupList}
          sourceAccessGroup={duplicateSource}
        />
      )}

      {canCreateOrDelete && (
        <Toolbar>
          <Button
            label="New access group"
            onClick={() => setShowNewAccessGroup(true)}
            icon="group_add"
          />
          <Button
            label="Duplicate access group"
            onClick={() => setDuplicateSource(selection?.name)}
            icon="content_copy"
            disabled={!selection}
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
