import { useState, useMemo } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button, TablePanel, Section, Toolbar } from '@ynput/ayon-react-components'
import { useGetAccessGroupsQuery } from '/src/services/accessGroups/getAccessGroups'
import NewAccessGroup from './NewAccessGroup'

const AccessGroupList = ({ projectName, selectedAccessGroup, onSelectAccessGroup }) => {
  const [showNewAccessGroup, setShowNewAccessGroup] = useState(false)

  // Load user list
  const { data: accessGroupList = [], isLoading: loading } = useGetAccessGroupsQuery({
    projectName,
  })

  // Selection
  const selection = useMemo(() => {
    for (const accessGroup of accessGroupList) {
      if (accessGroup.name === selectedAccessGroup?.name) return accessGroup
    }
  }, [selectedAccessGroup, accessGroupList])

  const onSelectionChange = (e) => {
    if (!onSelectAccessGroup) return
    onSelectAccessGroup({
      name: e.value.name,
      isProjectLevel: e.value.isProjectLevel,
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
    return { 'changed-project': rowData.isProjectLevel }
  }

  // Render

  return (
    <Section style={{ maxWidth: 400 }}>
      {showNewAccessGroup && (
        <NewAccessGroup onClose={onNewAccessGroup} accessGroupList={accessGroupList} />
      )}

      <Toolbar>
        <Button
          label="New access group"
          onClick={() => setShowNewAccessGroup(true)}
          icon="group_add"
        />
      </Toolbar>

      <TablePanel loading={loading}>
        <DataTable
          value={accessGroupList}
          scrollable="true"
          scrollHeight="flex"
          dataKey="name"
          selectionMode="single"
          selection={selection}
          onSelectionChange={onSelectionChange}
          rowClassName={getRowClass}
        >
          <Column field="name" header="Access group" />
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default AccessGroupList
