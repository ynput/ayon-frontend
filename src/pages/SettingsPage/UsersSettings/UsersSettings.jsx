import { useState, useMemo, useRef } from 'react'
import { toast } from 'react-toastify'
import { Button, Section, Toolbar, InputText } from '@ynput/ayon-react-components'
// Comps
import SetPasswordDialog from './SetPasswordDialog'
import RenameUserDialog from './RenameUserDialog'
// utils
import './users.scss'
import useSearchFilter from '@hooks/useSearchFilter'
import { useGetUsersQuery } from '@shared/api'
import UserDetail from './userDetail'
import UserList from './UserList'
import { useDeleteUserMutation, useUpdateUserMutation } from '@shared/api'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { useSelector } from 'react-redux'
import UsersOverview from './UsersOverview'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import NewUser from './newUser'
import NewServiceUser from './newServiceUser'
import { useGetAccessGroupsQuery } from '@queries/accessGroups/getAccessGroups'
import Shortcuts from '@containers/Shortcuts'
import DeleteUserDialog from './DeleteUserDialog'
import LicensesDialog from '@components/LicensesDialog/LicensesDialog'
import { useQueryParam } from 'use-query-params'

// what to show in the access column
const formatAccessGroups = (rowData) => {
  let res = {}
  // If the user is an admin, add 'admin' role
  if (rowData.isAdmin) res.admin = { cls: 'role admin' }
  // If the user is a service, add 'service' role
  else if (rowData.isService) res.service = { cls: 'role manager' }
  // If the user is a manager, add 'manager' role
  else if (rowData.isManager) res.manager = { cls: 'role manager' }
  // If no projects are selected, add default access groups
  else {
    // add all access groups
    for (const project in rowData.accessGroups) {
      const projectAG = rowData.accessGroups[project]
      for (const agName of projectAG) {
        // add to res if not already there
        if (!(agName in res)) res[agName] = { cls: 'role' }
      }
    }
  }

  // if res is empty add none
  if (!Object.keys(res).length) res.none = { cls: 'role partial' }

  return { ...rowData, accessGroups: res, accessGroupList: Object.keys(res) }
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
  const [selectedProjects] = useState(null)
  const [showNewUser, setShowNewUser] = useState(false)
  const [showNewServiceUser, setShowNewServiceUser] = useState(false)
  const [showRenameUser, setShowRenameUser] = useState(false)
  const [showDeleteUser, setShowDeleteUser] = useState(false)
  const [showSetPassword, setShowSetPassword] = useState(false)
  const [showLicenses, setShowLicenses] = useQueryParam('licenses', false)

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

  // GET ACCESS GROUPS QUERY
  const { data: accessGroupsData } = useGetAccessGroupsQuery({
    projectName: '_',
  })

  // MUTATION HOOK
  const [deleteUser] = useDeleteUserMutation()
  const [updateUser] = useUpdateUserMutation()

  const handleDisable = async (users) => {
    toastId.current = toast.info('Disabling users...')
    let i = 0
    for (const user of users) {
      try {
        await updateUser({
          name: user,
          patch: { active: false },
        }).unwrap()

        toast.update(toastId.current, {
          render: `Disabled user ${user}`,
          type: toast.TYPE.SUCCESS,
        })
        i += 1
      } catch {
        toast.error(`Unable to disable user: ${user}`)
      }
    }
    setShowDeleteUser(false)
    toast.update(toastId.current, { render: `Disabled ${i} user(s)`, type: toast.TYPE.SUCCESS })
  }

  const handleDelete = async (users) => {
    toastId.current = toast.info('Deleting users...')
    let i = 0
    for (const user of users) {
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
    setShowDeleteUser(false)
    toast.update(toastId.current, { render: `Deleted ${i} user(s)`, type: toast.TYPE.SUCCESS })
  }

  const openNewUser = () => {
    setShowNewUser(true)
  }
  const openNewServiceUser = () => {
    setShowNewServiceUser(true)
  }

  let userListWithAccessGroups = useMemo(
    () => userList.map((user) => formatAccessGroups(user)),
    [userList],
  )

  const searchableFields = [
    'name',
    'attrib.fullName',
    'attrib.email',
    'accessGroupList',
    'hasPassword',
  ]

  const [search, setSearch, filteredData] = useSearchFilter(
    searchableFields,
    userListWithAccessGroups,
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

  const shortcuts = useMemo(
    () => [
      {
        key: 'n',
        action: () => setShowNewUser(true),
      },
    ],
    [showNewUser],
  )

  return (
    <>
      <Shortcuts shortcuts={shortcuts} deps={[showNewUser]} />

      <NewUser
        onHide={(newUsers = []) => {
          setShowNewUser(false)
          if (newUsers.length) setSelectedUsers(newUsers)
        }}
        open={showNewUser}
        accessGroupsData={accessGroupsData}
      />

      <NewServiceUser
        onHide={(newUsers = []) => {
          setShowNewServiceUser(false)
          if (newUsers.length) setSelectedUsers(newUsers)
        }}
        open={showNewServiceUser}
      />

      <main>
        <Section>
          <Toolbar>
            <Button label="Licenses" onClick={() => setShowLicenses(true)} />
            <UsersOverview users={userList} />
            <form style={{ flex: 1 }} autoComplete="off" onSubmit={(e) => e.preventDefault()}>
              <InputText
                style={{ width: '100%', minWidth: 150 }}
                placeholder="Filter users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="search-users"
              />
            </form>
            <Button
              onClick={() => setShowDeleteUser(selectedUsers)}
              label="Delete Users"
              icon="person_remove"
              disabled={!selectedUsers.length || isSelfSelected || managerDisabled}
            />
            <Button onClick={openNewServiceUser} label="Add Service User" icon="person_add" />
            <Button
              onClick={openNewUser}
              label="Add New User"
              icon="person_add"
              data-shortcut="n"
            />
          </Toolbar>
          <Splitter
            style={{ width: '100%', height: '100%' }}
            layout="horizontal"
            stateKey="users-panels"
            stateStorage="local"
          >
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
                  setShowDeleteUser,
                  isLoading,
                  isSelfSelected,
                }}
              />
            </SplitterPanel>
            <SplitterPanel
              size={20}
              style={{ minWidth: 370, display: selectedUsers.length ? 'block' : 'none' }}
            >
              {!!selectedUsers.length && (
                <UserDetail
                  setShowRenameUser={setShowRenameUser}
                  selectedUsers={selectedUsers}
                  setShowSetPassword={setShowSetPassword}
                  setSelectedUsers={setSelectedUsers}
                  isSelfSelected={isSelfSelected}
                  selectedUserList={selectedUserList}
                  managerDisabled={managerDisabled}
                  accessGroupsData={accessGroupsData}
                  isFetchingUsers={isFetching}
                />
              )}
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

        {showDeleteUser && (
          <DeleteUserDialog
            selectedUsers={selectedUsers}
            onHide={() => setShowDeleteUser(false)}
            onDelete={() => handleDelete(selectedUsers)}
            onDisable={() => handleDisable(selectedUsers)}
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

        {showLicenses && <LicensesDialog onClose={() => setShowLicenses(undefined)} />}
      </main>
    </>
  )
}

export default UsersSettings
