import { useState, useMemo, useRef } from 'react'
import { toast } from 'react-toastify'
import { confirmDialog } from 'primereact/confirmdialog'
import { Button, Section, Toolbar, InputText, Spacer } from '@ynput/ayon-react-components'
// Comps
import SetPasswordDialog from './SetPasswordDialog'
import RenameUserDialog from './RenameUserDialog'
// utils
import './users.scss'
import useSearchFilter from '/src/hooks/useSearchFilter'
import { useGetUsersQuery } from '../../../services/user/getUsers'
import ProjectList from '/src/containers/projectList'
import UserDetail from './userDetail'
import UserList from './UserList'
import { useDeleteUserMutation } from '/src/services/user/updateUser'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { SelectButton } from 'primereact/selectbutton'
import { useSelector } from 'react-redux'
import UsersOverview from './UsersOverview'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import NewUser from './newUser'

// TODO: Remove classname assignments and do in styled components
const formatRoles = (rowData, selectedProjects) => {
  let res = {}
  if (rowData.isAdmin) res.admin = { cls: 'role admin' }
  else if (rowData.isService) res.service = { cls: 'role manager' }
  else if (rowData.isManager) res.manager = { cls: 'role manager' }
  else if (!selectedProjects) {
    for (const name of rowData.defaultRoles || []) res[name] = { cls: 'role default' }
  } else {
    const roleSet = rowData.roles
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
  // QUERY PARAMS STATE
  const [searchParams] = useSearchParams()
  const queryNames = searchParams.getAll('name')

  const [selectedUsers, setSelectedUsers] = useState([])

  const toastId = useRef(null)

  // set initial selected users
  useEffect(() => {
    if (queryNames.length) {
      setSelectedUsers(queryNames)
      // remove from url
      searchParams.delete('name')
      window.history.replaceState({}, '', `${window.location.pathname}?${searchParams}`)
    }
  }, [])

  // USE STATE
  const [selectedProjects, setSelectedProjects] = useState(null)
  const [showNewUser, setShowNewUser] = useState(false)
  const [showRenameUser, setShowRenameUser] = useState(false)
  const [showSetPassword, setShowSetPassword] = useState(false)
  // show users for selected projects
  const [showProjectUsers, setShowProjectUsers] = useState(false)

  // get user name from redux
  const selfName = useSelector((state) => state.user.name)
  const isAdmin = useSelector((state) => state.user.data.isAdmin)
  const isSelfSelected = selectedUsers.includes(selfName)

  // RTK QUERY HOOKS
  let { data: userList = [], isLoading, isError, isFetching } = useGetUsersQuery({ selfName })
  if (isError || !Array.isArray(userList)) {
    userList = []
    toast.error('Unable to load users')
  }

  // MUTATION HOOK
  const [deleteUser] = useDeleteUserMutation()

  let filteredUserList = useMemo(() => {
    // filter out users that are not in project if showProjectUsers is true
    if (selectedProjects) {
      return userList.filter((user) => {
        // user level not user
        if (user.isManager || user.isAdmin || user.isService) return true

        // check user has role in selected projects
        const roleSet = user.roles
        let hasRole = selectedProjects.some((project) => roleSet[project]?.length)

        return hasRole
      })
    } else {
      return userList
    }
  }, [userList, selectedProjects])

  const onDelete = async () => {
    confirmDialog({
      message: `Are you sure you want to delete ${selectedUsers.length} user(s)?`,
      header: 'Delete users',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        toastId.current = toast.info('Deleting users...')
        let i = 0
        for (const user of selectedUsers) {
          try {
            await deleteUser({ user }).unwrap()
            toast.update(toastId.current, {
              render: `Deleted user: ${user}`,
              type: toast.TYPE.SUCCESS,
            })
            setSelectedUsers([])
            i += 1
          } catch {
            toast.error(`Unable to delete user: ${user}`)
          }
        }
        toast.update(toastId.current, { render: `Deleted ${i} user(s)`, type: toast.TYPE.SUCCESS })
      },
      reject: () => {},
    })
  }

  const onTotal = (total) => {
    // if total already in serch, remove it
    if (search === total) return setSearch('')

    // if "total" select all users
    // else set search to total
    if (total === 'total') {
      setSearch('')
      setSelectedUsers(filteredUserList.map((user) => user.name))
      if (selectedProjects) setShowProjectUsers(true)
    } else {
      setSearch(total)
    }
  }

  const openNewUser = () => {
    setShowNewUser(true)
    setSelectedUsers([])
  }

  // use filteredUserList if showProjectUsers
  // else use userList

  if (showProjectUsers) userList = filteredUserList

  let userListWithRoles = useMemo(
    () => userList.map((user) => formatRoles(user, selectedProjects)),
    [userList, selectedProjects],
  )

  const searchableFields = ['name', 'attrib.fullName', 'attrib.email', 'rolesList', 'hasPassword']

  const [search, setSearch, filteredData] = useSearchFilter(
    searchableFields,
    userListWithRoles,
    'users',
  )

  const selectedUserList = userList.filter((user) => selectedUsers.includes(user.name))

  const levels = useMemo(() => {
    let levels = []
    selectedUserList.forEach((user) => {
      let res
      if (user.isAdmin) res = 'admin'
      else if (user.isService) res = 'service'
      else if (user.isManager) res = 'manager'
      else res = 'user'

      if (!levels.includes(res)) levels.push(res)
    })

    return levels
  }, [selectedUserList])

  // managers can't update admin users
  const managerDisabled = levels.some((l) => ['admin'].includes(l)) && !isAdmin && !isSelfSelected

  // Render

  // return null

  return (
    <main>
      <Section>
        <Toolbar>
          <SelectButton
            value={showProjectUsers}
            options={[
              { label: 'All Users', value: false },
              { label: 'Selected Projects', value: true },
            ]}
            onChange={(e) => setShowProjectUsers(e.value)}
            disabled={!selectedProjects}
          />
          <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
            <InputText
              style={{ width: '200px' }}
              placeholder="Filter users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autocomplete="search-users"
            />
          </form>
          <Spacer />
          <Button
            onClick={onDelete}
            label="Delete Users"
            icon="person_remove"
            disabled={!selectedUsers.length || isSelfSelected || managerDisabled}
          />
          <Button onClick={openNewUser} label="Add New User" icon="person_add" />
        </Toolbar>
        <Splitter
          style={{ width: '100%', height: '100%' }}
          layout="horizontal"
          stateKey="users-panels"
          stateStorage="local"
        >
          <SplitterPanel size={10}>
            <ProjectList
              showNull="( default )"
              multiselect={true}
              selection={selectedProjects}
              onSelect={setSelectedProjects}
              style={{ maxWidth: 'unset' }}
              className="wrap"
            />
          </SplitterPanel>
          <SplitterPanel size={50}>
            <UserList
              userList={userList}
              tableList={filteredData}
              onSelectUsers={setSelectedUsers}
              isFetching={isFetching}
              {...{
                selectedProjects,
                selectedUsers,
                setShowSetPassword,
                setShowRenameUser,
                onDelete,
                isLoading,
                isSelfSelected,
              }}
            />
          </SplitterPanel>
          <SplitterPanel size={40} style={{ minWidth: 370 }}>
            {selectedUsers.length ? (
              <UserDetail
                setShowRenameUser={setShowRenameUser}
                selectedUsers={selectedUsers}
                setShowSetPassword={setShowSetPassword}
                selectedProjects={selectedProjects}
                setSelectedUsers={setSelectedUsers}
                isSelfSelected={isSelfSelected}
                selectedUserList={selectedUserList}
                managerDisabled={managerDisabled}
              />
            ) : (
              !showNewUser && (
                <UsersOverview
                  selectedProjects={selectedProjects}
                  userList={filteredUserList}
                  onUserSelect={(user) => setSelectedUsers([user.name])}
                  onTotal={onTotal}
                  search={search}
                />
              )
            )}
            <NewUser
              onHide={(newUsers = []) => {
                setShowNewUser(false)
                if (newUsers.length) setSelectedUsers(newUsers)
              }}
              open={showNewUser && !selectedUsers.length}
            />
          </SplitterPanel>
        </Splitter>
      </Section>

      {showRenameUser && (
        <RenameUserDialog
          selectedUsers={selectedUsers}
          onHide={() => setShowRenameUser(false)}
          onSuccess={(name) => setSelectedUsers([name])}
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
