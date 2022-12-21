import { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Dialog } from 'primereact/dialog'
import {
  Button,
  InputText,
  TablePanel,
  Spacer,
  FormLayout,
  FormRow,
  Section,
  Toolbar,
} from '@ynput/ayon-react-components'
import axios from 'axios'

const NewRoleDialog = ({ onClose, rolesList }) => {
  const [roleName, setRoleName] = useState('')

  const roleNames = useMemo(() => rolesList.map((i) => i?.name.toLowerCase()), [rolesList])

  const onSubmit = () => {
    axios
      .put(`/api/roles/${roleName}/_`, {})
      .then(() => {
        toast.success('Role created')
        onClose()
      })
      .catch((err) => {
        console.log(err)
        toast.error('Unable to create role')
      })
  }

  let error = null
  if (roleNames.includes(roleName.toLowerCase())) error = 'This role already exists'
  else if (!roleName.match('^[a-zA-Z_]{2,20}$')) error = 'Invalid role name'

  const footer = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      <Spacer />
      <Button label="Create" icon="group_add" disabled={!!error} onClick={onSubmit} />
    </div>
  )

  return (
    <Dialog
      header="New role"
      footer={footer}
      onHide={onClose}
      visible={true}
      style={{ width: 500 }}
    >
      <FormLayout>
        <FormRow label="Role name">
          <InputText value={roleName} onChange={(e) => setRoleName(e.target.value)} />
        </FormRow>
        <FormRow>{error && <span className="form-error-text">{error}</span>}</FormRow>
      </FormLayout>
    </Dialog>
  )
}

const RolesList = ({ projectName, selectedRole, onSelectRole, reloadTrigger }) => {
  const [rolesList, setRolesList] = useState([])
  const [loading, setLoading] = useState(false)
  const [showNewRole, setShowNewRole] = useState(false)

  // Load user list

  const loadRoles = () => {
    setLoading(true)
    let result = []
    axios
      .get(`/api/roles/${projectName || '_'}`)
      .then((response) => {
        result = response.data
      })
      .catch(() => {
        toast.error('Unable to load roles')
      })
      .finally(() => {
        setRolesList(result)
        setLoading(false)
      })
  }

  useEffect(() => {
    loadRoles()
  }, [projectName, reloadTrigger])

  // Selection
  const selection = useMemo(() => {
    for (const role of rolesList) {
      if (role.name === selectedRole?.name) return role
    }
  }, [selectedRole, rolesList])

  const onSelectionChange = (e) => {
    if (!onSelectRole) return
    onSelectRole({
      name: e.value.name,
      isProjectLevel: e.value.isProjectLevel,
    })
  }

  const getRowClass = (rowData) => {
    return { 'changed-project': rowData.isProjectLevel }
  }

  // Render

  return (
    <Section style={{ maxWidth: 400 }}>
      {showNewRole && (
        <NewRoleDialog
          onClose={() => {
            setShowNewRole(false)
            loadRoles()
          }}
          rolesList={rolesList}
        />
      )}

      <Toolbar>
        <Button label="New role" onClick={() => setShowNewRole(true)} icon="group_add" />
      </Toolbar>

      <TablePanel loading={loading}>
        <DataTable
          value={rolesList}
          scrollable="true"
          scrollHeight="flex"
          dataKey="name"
          selectionMode="single"
          selection={selection}
          onSelectionChange={onSelectionChange}
          rowClassName={getRowClass}
        >
          <Column field="name" header="Role name" />
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default RolesList
