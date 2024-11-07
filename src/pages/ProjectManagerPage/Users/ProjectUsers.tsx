import { UserNode } from '@api/graphql'
import { useGetUsersQuery } from '@queries/user/getUsers'
import { $Any } from '@types'
import { Button, SaveButton, Spacer, Toolbar } from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import ProjectUserList from './ProjectUserList'
import SearchFilter from '@components/SearchFilter/SearchFilter'
import { useListProjectsQuery } from '@queries/project/getProject'
import { useGetAccessGroupsQuery } from '@queries/accessGroups/getAccessGroups'
import AssignAccessGroupsDialog from './AssignAccessGroupsDialog'
import {api }from '@api/rest/project'
import { useUpdateProjectUsersMutation } from '@queries/project/updateProject'
import { toast } from 'react-toastify'
import ProjectList from '@containers/projectList'
import { getAllProjectUsers, mapUsersByAccessGroups } from './mappers'
import { SelectedAccessGroupUsers } from './types'

type Props = {}

const ProjectUsers = ({}: Props) => {
  const selfName = useSelector((state: $Any) => state.user.name)
  let { data: userList = [], isLoading } = useGetUsersQuery({ selfName })

  const { data: projectsList = [] } = useListProjectsQuery({})
  // Load user list
  const { data: accessGroupList = [] } = useGetAccessGroupsQuery({
    projectName: '_',
  })

  const [updateUser] = useUpdateProjectUsersMutation()

  // const accessGroups = { artist: ['project_a', 'project_b', 'project_c'], freelancer: [], supervisor: [] }
  // const { allProjects, activeProjects } = getProjectsListForSelection([], accessGroups)

  // const [localActiveProjects, setLocalActiveProjects] = useState<$Any[]>(activeProjects)
  // const [selectedAccessGroups, setSelectedAccessGroups] = useState<$Any>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showDialog, setShowDialog] = useState<boolean>(false)
  const [selectedAccessGroupUsers, setSelectedAccessGroupUsers] = useState<SelectedAccessGroupUsers | undefined>()



  const onSelectProjects = (selection: $Any) => {
    setSelectedProjects([selection])
  }

  const actionEnabled = selectedProjects.length > 0 && selectedUsers.length > 0

  const activeNonManagerUsers = userList.filter(
    (user: UserNode) => !user.isAdmin && !user.isManager && user.active,
  )

  const result = api.useGetProjectUsersQuery({ projectName: selectedProjects[0] || '_' })
  const mappedUsers = mapUsersByAccessGroups(result.data)
  const allProjectUsers = getAllProjectUsers(mappedUsers)
  const unasignedUsers = activeNonManagerUsers.filter((user: UserNode) => !allProjectUsers.includes(user.name))

  const getAccessGroupUsers = (accessGroup?: string): string[] => {
    if (!selectedAccessGroupUsers || !accessGroup) {
      return []
    }
    return selectedAccessGroupUsers.accessGroup === accessGroup ?  selectedAccessGroupUsers.users : []
  }

  const onFiltersChange = (changes: $Any) => {
    console.log('on change? ', changes)
  }

  const onFiltersFinish = (changes: $Any) => {
    console.log('on filters finish: ', changes)
  }

  const updateSelectedAccessGroupUsers = (accessGroup: string, selectedUsers: string[]) => {
    setSelectedAccessGroupUsers({ accessGroup, users: selectedUsers })
  }

  const onSave = async (changes: $Any) => {
    for (const user of selectedUsers) {
      const accessGroups = changes.filter((ag: $Any) => ag.selected).map((ag: $Any) => ag.name)

      try {
        await updateUser({
          projectName: selectedProjects,
          userName: user,
          update: accessGroups
        }).unwrap()
      } catch (error: $Any) {
        console.log(error)
        toast.error(error.details)
      }
    }
  }

  return (
    <div style={{ height: '100%' }}>
      <Toolbar style={{ display: 'flex', margin: '4px 0' }}>
        <SearchFilter
          filters={[]}
          onChange={(v) => onFiltersChange(v)}
          onFinish={(v) => onFiltersFinish(v)} // when changes are applied
          options={[]}
        />
        <Spacer />
        <Button
          icon="remove"
          label="Remove access"
          disabled={!actionEnabled}
          // onClick={handleRevert}
        />
        <SaveButton
          icon="add"
          label="Add access"
          disabled={!actionEnabled}
          onClick={() => setShowDialog(true)}
          // active={canCommit}
          // saving={commitUpdating}
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
            userList={unasignedUsers}
            tableList={unasignedUsers}
            isLoading={isLoading}
            onSelectUsers={(selection: string[]) => setSelectedUsers(selection)}
            sortable
            isUnassigned
          />
        </SplitterPanel>

        <SplitterPanel size={20}>
          <Splitter layout="vertical">
            {Object.keys(mappedUsers)
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
