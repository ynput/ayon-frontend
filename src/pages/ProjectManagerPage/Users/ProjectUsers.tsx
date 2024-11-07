import { UserNode } from '@api/graphql'
import { $Any } from '@types'
import { Button, SaveButton, Spacer, Toolbar } from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { useState } from 'react'
import ProjectUserList from './ProjectUserList'
import SearchFilter from '@components/SearchFilter/SearchFilter'
import { useGetAccessGroupsQuery } from '@queries/accessGroups/getAccessGroups'
import AssignAccessGroupsDialog from './AssignAccessGroupsDialog'
import ProjectList from '@containers/projectList'
import { SelectedAccessGroupUsers } from './types'
import { useProjectAccessGroupData } from './hooks'
import { toast } from 'react-toastify'
import { useGetUsersQuery } from '@queries/user/getUsers'
import { getAllProjectUsers, mapUsersByAccessGroups } from './mappers'
import { useSelector } from 'react-redux'

type Props = {}

const ProjectUsers = ({}: Props) => {
  const { data: accessGroupList = [] } = useGetAccessGroupsQuery({
    projectName: '_',
  })

  // const accessGroups = { artist: ['project_a', 'project_b', 'project_c'], freelancer: [], supervisor: [] }
  // const { allProjects, activeProjects } = getProjectsListForSelection([], accessGroups)
  // const [localActiveProjects, setLocalActiveProjects] = useState<$Any[]>(activeProjects)
  // const [selectedAccessGroups, setSelectedAccessGroups] = useState<$Any>([])
  // const onSelectProjects = (selection: $Any) => { setSelectedProjects([selection]) }
  // const onFiltersChange = (changes: $Any) => { console.log('on change? ', changes) }
  // const onFiltersFinish = (changes: $Any) => { console.log('on filters finish: ', changes) }

  const {
    users: projectUsers,
    accessGroupUsers,
    selectedProjects,
    setSelectedProjects,
    removeUserAccessGroup,
    updateUserAccessGroups,
  } = useProjectAccessGroupData()

  const selfName = useSelector((state: $Any) => state.user.name)
  let { data: userList = [], isLoading } = useGetUsersQuery({ selfName })
  const activeNonManagerUsers = userList.filter(
    (user: UserNode) => !user.isAdmin && !user.isManager && user.active,
  )

  const mappedUsers = mapUsersByAccessGroups(projectUsers)
  const allProjectUsers = getAllProjectUsers(mappedUsers)
  const unassignedUsers = activeNonManagerUsers.filter((user: UserNode) => !allProjectUsers.includes(user.name))


  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [actionedUsers, setActionedUsers] = useState<string[]>([])
  const [showDialog, setShowDialog] = useState<boolean>(false)
  const [selectedAccessGroupUsers, setSelectedAccessGroupUsers] = useState<
    SelectedAccessGroupUsers | undefined
  >()


  const actionEnabled = selectedProjects.length > 0 && selectedUsers.length > 0

  const getAccessGroupUsers = (accessGroup?: string): string[] => {
    if (!selectedAccessGroupUsers || !accessGroup) {
      return []
    }
    return selectedAccessGroupUsers.accessGroup === accessGroup
      ? selectedAccessGroupUsers.users
      : []
  }


  const updateSelectedAccessGroupUsers = (accessGroup: string, selectedUsers: string[]) => {
    setSelectedAccessGroupUsers({ accessGroup, users: selectedUsers })
  }

  const onSave = async (changes: $Any, users: string[]) => {
    const errorMessage = await updateUserAccessGroups(users, changes)
    if (errorMessage) {
      toast.error(errorMessage)
    }
  }
  const onRemove = (accessGroup: string) => (user: string) => {
    removeUserAccessGroup(user, accessGroup)
  }

  return (
    <div style={{ height: '100%' }}>
      <Toolbar style={{ display: 'flex', margin: '4px 0' }}>
        {/* @ts-ignore */}
        <SearchFilter
          filters={[]}
          // onChange={(v) => onFiltersChange(v)}
          // onFinish={(v) => onFiltersFinish(v)} // when changes are applied
          options={[]}
        />
      </Toolbar>

      <Splitter layout="horizontal" style={{ height: '100%' }}>
        <SplitterPanel
          className="flex align-items-center justify-content-center"
          size={25}
          minSize={10}
        >
          {/* @ts-ignore */}
          <ProjectList selection={selectedProjects} onSelect={setSelectedProjects} multiselect />
        </SplitterPanel>

        <SplitterPanel size={50}>
          <ProjectUserList
            header="Username"
            selectedUsers={selectedUsers}
            userList={unassignedUsers}
            tableList={unassignedUsers}
            isLoading={isLoading}
            onAdd={() => {
              setActionedUsers(selectedUsers)
              setShowDialog(true)
            }}
            onSelectUsers={(selection: string[]) => setSelectedUsers(selection)}
            sortable
            isUnassigned
          />
        </SplitterPanel>

        <SplitterPanel size={20}>
          <Splitter layout="vertical">
            {Object.keys(mappedUsers)
              .sort()
              .map((accessGroup) => {
                return (
                  <SplitterPanel
                    key={accessGroup}
                    className="flex align-items-center justify-content-center"
                    minSize={20}
                  >
                    <ProjectUserList
                      header={accessGroup}
                      selectedUsers={getAccessGroupUsers(accessGroup)}
                      userList={mappedUsers[accessGroup]}
                      tableList={activeNonManagerUsers.filter((user: UserNode) =>
                        mappedUsers[accessGroup].includes(user.name),
                      )}
                      onSelectUsers={(selection: string[]) =>
                        updateSelectedAccessGroupUsers(accessGroup, selection)
                      }
                      onAdd={() => {
                        setActionedUsers(getAccessGroupUsers(accessGroup))
                        setShowDialog(true)
                      }}
                      onRemove={onRemove(accessGroup)}
                      isLoading={isLoading}
                    />
                  </SplitterPanel>
                )
              })}
          </Splitter>
        </SplitterPanel>
      </Splitter>

      {showDialog && (
        <AssignAccessGroupsDialog
          users={actionedUsers}
          accessGroups={accessGroupList.map((item) => ({ ...item, selected: false }))}
          onSave={onSave}
          onClose={function (): void {
            setShowDialog(false)
          }}
        />
      )}
    </div>
  )
}
export default ProjectUsers
