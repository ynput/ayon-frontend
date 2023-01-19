import { useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog'
import { Button, Section, Toolbar, InputText } from '@ynput/ayon-react-components'
// Comps
import NewUserDialog from './newUserDialog'
import SetPasswordDialog from './SetPasswordDialog'
import RenameUserDialog from './RenameUserDialog'
// utils
import axios from 'axios'
import './users.sass'
import useSearchFilter from '/src/hooks/useSearchFilter'
import { useGetUsersQuery } from '../../../services/user/getUsers'
import { useGetRolesQuery } from '/src/services/getRoles'
import ProjectList from '/src/containers/projectList'
import styled from 'styled-components'
import UserDetail from './userDetail'
import UserList from './UserList'

const SectionStyled = styled(Section)`
  & > * {
    height: 100%;
    flex: 1;
  }
`

// TODO: Remove classname assignments and do in styled components
const formatRoles = (rowData, selectedProjects) => {
  let res = {}
  if (rowData.isAdmin) res.admin = { cls: 'role admin' }
  else if (rowData.isService) res.service = { cls: 'role manager' }
  else if (rowData.isManager) res.manager = { cls: 'role manager' }
  else if (!selectedProjects) {
    for (const name of rowData.defaultRoles || []) res[name] = { cls: 'role default' }
  } else {
    const roleSet = JSON.parse(rowData.roles)
    for (const projectName of selectedProjects) {
      for (const roleName of roleSet[projectName] || []) {
        if (roleName in res) res[roleName].count += 1
        else res[roleName] = { count: 1 }
        res[roleName].cls =
          res[roleName].count === selectedProjects.length ? 'role all' : 'role partial'
      }
    }
  }

  return { ...rowData, roles: res, rolesList: Object.keys(res) }
}

const UsersSettings = () => {
  const [selectedUsers, setSelectedUsers] = useState([])
  const [userDetailData, setUserDetailData] = useState({})
  const [selectedProjects, setSelectedProjects] = useState(null)
  const [showNewUser, setShowNewUser] = useState(false)
  const [showRenameUser, setShowRenameUser] = useState(false)
  const [showSetPassword, setShowSetPassword] = useState(false)

  const { data: userList = [], isLoading, isError } = useGetUsersQuery()
  if (isError) toast.error('Unable to load users')

  const {
    data: rolesList = [],
    isLoading: isLoadingRoles,
    isError: isErrorRoles,
  } = useGetRolesQuery()
  if (isErrorRoles) toast.error('Unable to load roles')

  // TODO: RTK QUERY
  const onDelete = async () => {
    confirmDialog({
      message: `Are you sure you want to delete ${selectedUsers.length} user(s)?`,
      header: 'Delete users',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        for (const user of selectedUsers) {
          try {
            await axios.delete(`/api/users/${user}`)
            toast.success(`Deleted user ${user}`)
          } catch {
            toast.error(`Unable to delete user ${user}`)
          }
        }
      },
      reject: () => {},
    })
  }

  let userListWithRoles = useMemo(
    () => userList.map((user) => formatRoles(user, selectedProjects)),
    [userList],
  )

  const searchableFields = ['name', 'attrib.fullName', 'attrib.email', 'rolesList', 'hasPassword']

  const [search, setSearch, filteredData] = useSearchFilter(searchableFields, userListWithRoles)

  // Render

  return (
    <main>
      <Section>
        <ConfirmDialog />
        <Toolbar>
          <Button onClick={() => setShowNewUser(true)} label="Add New User" icon="person_add" />
          <Button
            onClick={onDelete}
            label="Delete Selected Users"
            icon="person_remove"
            disabled={!selectedUsers.length}
          />
          <InputText
            style={{ width: '200px' }}
            placeholder="Filter users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Toolbar>
        <SectionStyled style={{ display: 'flex', flexDirection: 'row' }}>
          <ProjectList
            showNull="( default )"
            multiselect={true}
            selection={selectedProjects}
            onSelect={setSelectedProjects}
          />
          <UserList
            userList={userList}
            tableList={filteredData}
            {...{
              selectedProjects,
              selectedUsers,
              setUserDetailData,
              rolesList,
              setShowSetPassword,
              setShowRenameUser,
              onDelete,
              isLoading,
              isLoadingRoles,
              setSelectedUsers,
            }}
          />
          <UserDetail userDetailData={userDetailData} />
        </SectionStyled>
      </Section>

      {showNewUser && (
        <NewUserDialog
          rolesList={rolesList}
          onHide={() => {
            setShowNewUser(false)
          }}
        />
      )}

      {showRenameUser && (
        <RenameUserDialog
          selectedUsers={selectedUsers}
          onHide={() => {
            setShowRenameUser(false)
          }}
        />
      )}

      {showSetPassword && (
        <SetPasswordDialog
          selectedUsers={selectedUsers}
          onHide={() => {
            setShowSetPassword(false)
          }}
        />
      )}
    </main>
  )
}

export default UsersSettings
