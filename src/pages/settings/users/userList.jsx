import { useState, useEffect, useMemo, useRef } from 'react'
import { toast } from 'react-toastify'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { ContextMenu } from 'primereact/contextmenu'
import { Dialog } from 'primereact/dialog'
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog'
import {
  TableWrapper,
  Button,
  InputText,
  Password,
  FormLayout,
  FormRow,
  Section,
  Panel,
  Toolbar,
} from '/src/components'
import NewUserDialog from './newUserDialog'
import axios from 'axios'

import './users.sass'

const USERS_QUERY = `
  query UserList {
    users {
      edges {
        node {
          name
          isAdmin
          isManager
          isService
          active
          roles
          defaultRoles
          hasPassword
          attrib {
            fullName
            email
          }
        }
      }
    }
  }
`

const buildUserDetailData = (
  projectNames,
  roleNames,
  users,
  lastSelectedUser
) => {
  let roles = []
  let roleSet = []
  if (lastSelectedUser) {
    if (!projectNames) roleSet = lastSelectedUser.defaultRoles || []
    else {
      const uroles = JSON.parse(lastSelectedUser.roles) || []
      for (const projectName of projectNames || []) {
        roleSet = [...roleSet, ...(uroles[projectName] || [])]
      }
    }
  }

  for (const roleName of roleNames)
    roles.push({
      name: roleName,
      shouldSelect: roleSet.includes(roleName),
    })

  let userLevel = 'user'
  if (lastSelectedUser?.isAdmin) userLevel = 'admin'
  else if (lastSelectedUser?.isService) userLevel = 'service'
  else if (lastSelectedUser?.isManager) userLevel = 'manager'

  return {
    users,
    projectNames,
    roles,
    userLevel,
    userActive: lastSelectedUser?.active,
  }
}

const formatRoles = (rowData, selectedProjects) => {
  let res = {}
  if (rowData.isAdmin) res.admin = { cls: 'role admin' }
  else if (rowData.isService) res.service = { cls: 'role manager' }
  else if (rowData.isManager) res.manager = { cls: 'role manager' }
  else if (!selectedProjects) {
    for (const name of rowData.defaultRoles || [])
      res[name] = { cls: 'role default' }
  } else {
    const roleSet = JSON.parse(rowData.roles)
    for (const projectName of selectedProjects) {
      for (const roleName of roleSet[projectName] || []) {
        if (roleName in res) res[roleName].count += 1
        else res[roleName] = { count: 1 }
        res[roleName].cls =
          res[roleName].count === selectedProjects.length
            ? 'role all'
            : 'role partial'
      }
    }
  }

  return (
    <>
      {Object.keys(res).map((roleName) => (
        <span key={roleName} className={res[roleName].cls}>
          {roleName}
        </span>
      ))}
    </>
  )
}

const RenameUserDialog = ({ onHide, selectedUsers }) => {
  const [newName, setNewName] = useState('')

  if (!selectedUsers?.length) {
    // this shouldn't happen
    onHide()
    return <></>
  }

  const oldName = selectedUsers[0]
  const onSubmit = () => {
    axios
      .patch(`/api/users/${oldName}/rename`, { newName })
      .then(() => toast.success('User renamed'))
      .catch(() => toast.error('Unable to rename user'))
      .finally(() => onHide())
  }
  return (
    <Dialog header={`Rename user ${oldName}`} visible={true} onHide={onHide}>
      <FormLayout>
        <FormRow label="New name">
          <InputText
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </FormRow>
        <FormRow>
          <Button label="Rename" onClick={onSubmit} />
        </FormRow>
      </FormLayout>
    </Dialog>
  )
}

const SetPasswordDialog = ({ onHide, selectedUsers }) => {
  const [password, setPassword] = useState('')

  if (!selectedUsers?.length) {
    // this shouldn't happen
    onHide()
    return <></>
  }

  const userName = selectedUsers[0]
  const onSubmit = () => {
    axios
      .patch(`/api/users/${userName}/password`, { password })
      .then(() => {
        onHide()
        toast.success('Password changed')
      })
      .catch(() => toast.error('Unable to change password'))
  }
  return (
    <Dialog
      header={`Change user ${userName} password`}
      visible={true}
      onHide={onHide}
    >
      <FormLayout>
        <FormRow label="New password">
          <Password
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormRow>
        <FormRow>
          <Button label="Set password" onClick={onSubmit} />
        </FormRow>
      </FormLayout>
    </Dialog>
  )
}

const UserList = ({
  selectedProjects,
  selectedUsers,
  onSelectUsers,
  reloadTrigger,
  setUserDetailData,
  onTriggerReload,
}) => {
  const [userList, setUserList] = useState([])
  const [rolesList, setRolesList] = useState([])
  const [loading, setLoading] = useState(false)
  const [showNewUser, setShowNewUser] = useState(false)
  const [lastSelectedUser, setLastSelectedUser] = useState(null)
  const [showRenameUser, setShowRenameUser] = useState(false)
  const [showSetPassword, setShowSetPassword] = useState(false)
  const contextMenuRef = useRef(null)

  // Load user list

  useEffect(() => {
    setLoading(true)
    let result = []
    axios
      .post('/graphql', {
        query: USERS_QUERY,
        variables: {},
      })
      .then((response) => {
        const edges = response?.data?.data?.users.edges
        if (!edges) return
        for (const edge of edges) result.push(edge.node)
      })
      .catch(() => {
        toast.error('Unable to load users')
      })
      .finally(() => {
        let newSelection = []
        for (const user of result) {
          if (selectedUsers.includes(user.name)) newSelection.push(user.name)
        }

        onSelectUsers(newSelection)
        setUserList(result)
        setLoading(false)
      })
  }, [reloadTrigger])

  useEffect(() => {
    setLoading(true)
    let result = []
    axios
      .get('/api/roles/_')
      .then((response) => {
        for (const role of response.data) result.push(role.name)
      })
      .catch(() => {
        toast.error('Unable to load roles')
      })
      .finally(() => {
        setRolesList(result)
        setLoading(false)
      })
  }, [])

  // Selection

  const selection = useMemo(() => {
    let result = []
    let lastUsr = null
    for (const user of userList) {
      if (selectedUsers.includes(user.name)) result.push(user)
      if (user?.name === lastSelectedUser?.name) lastUsr = { ...user }
    }
    if (setUserDetailData) {
      setLastSelectedUser(lastUsr)

      setUserDetailData(
        buildUserDetailData(selectedProjects, rolesList, result, lastUsr)
      )
    }
    return result
  }, [selectedUsers, userList, selectedProjects, reloadTrigger])

  const onSelectionChange = (e) => {
    if (!onSelectUsers) return
    let result = []
    for (const user of e.value) result.push(user.name)
    onSelectUsers(result)
  }

  // CTX

  const onDelete = async () => {
    confirmDialog({
      message: `Are you sure you want to delete ${selectedUsers.length} user(s)?`,
      header: 'Delete users',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        for (const user of selectedUsers) {
          try {
            await axios.delete(`/api/users/${user}`)
          } catch {
            toast.error(`Unable to delete user ${user}`)
          }
        }
        onTriggerReload()
      },
      reject: () => {},
    })
  }

  const contextMenuModel = [
    {
      label: 'Rename user',
      disabled: selection.length !== 1,
      command: () => setShowRenameUser(true),
    },
    {
      label: 'Set password',
      disabled: selection.length !== 1,
      command: () => setShowSetPassword(true),
    },
    {
      label: 'Delete selected',
      disabled: !selection.length,
      command: () => onDelete(),
    },
  ]

  // Render

  return (
    <Section>
      <ConfirmDialog />
      <Toolbar>
        <Button
          onClick={() => setShowNewUser(true)}
          label="Add a new user"
          icon="person_add"
        />
        <Button
          onClick={onDelete}
          label="Delete selected users"
          icon="person_remove"
          disabled={!selectedUsers.length}
        />
      </Toolbar>

      {showNewUser && (
        <NewUserDialog
          rolesList={rolesList}
          onHide={() => {
            setShowNewUser(false)
            onTriggerReload()
          }}
        />
      )}

      {showRenameUser && (
        <RenameUserDialog
          selectedUsers={selectedUsers}
          onHide={() => {
            setShowRenameUser(false)
            onTriggerReload()
          }}
        />
      )}

      {showSetPassword && (
        <SetPasswordDialog
          selectedUsers={selectedUsers}
          onHide={() => {
            setShowSetPassword(false)
            onTriggerReload()
          }}
        />
      )}

      <Panel className="nopad">
        <TableWrapper>
          <ContextMenu model={contextMenuModel} ref={contextMenuRef} />
          <DataTable
            value={userList}
            scrollable="true"
            scrollHeight="flex"
            dataKey="name"
            loading={loading}
            selectionMode="multiple"
            onSelectionChange={onSelectionChange}
            onContextMenu={(e) => contextMenuRef.current.show(e.originalEvent)}
            onContextMenuSelectionChange={(e) => {
              if (!selectedUsers.includes(e.value.name)) {
                onSelectUsers([...selection, e.value.name])
              }
              setLastSelectedUser(e.data)
            }}
            selection={selection}
            onRowClick={(e) => {
              setLastSelectedUser(e.data)
            }}
          >
            <Column field="name" header="Name" />
            <Column field="attrib.fullName" header="Full name" />
            <Column field="attrib.email" header="Email" />
            <Column
              header="Roles"
              body={(rowData) => formatRoles(rowData, selectedProjects)}
            />
            <Column
              header="Has password"
              body={(rowData) => (rowData.hasPassword ? 'yes' : '')}
            />
            <Column
              header="Active"
              body={(rowData) => (rowData.active ? 'yes' : '')}
            />
          </DataTable>
        </TableWrapper>
      </Panel>
    </Section>
  )
}

export default UserList
