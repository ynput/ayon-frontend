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
import ProjectList from '@containers/projectList'
import AssignAccessGroupsDialog from './AssignAccessGroupsDialog'

type Props = {}

const ProjectUsers = ({}: Props) => {
  const selfName = useSelector((state: $Any) => state.user.name)
  let { data: userList = [], isLoading } = useGetUsersQuery({ selfName })

  const { data: accessGroupList = [] } = useGetAccessGroupsQuery({
    projectName: '_',
  })
  console.log(accessGroupList)

  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showDialog, setShowDialog] = useState<boolean>(false)

  const onSelectProjects = (selection: string[]) => {
    setSelectedProjects(selection)
  }

  const actionEnabled = selectedProjects.length > 0 && selectedUsers.length > 0

  const filteredUsers = userList.filter(
    (user: UserNode) => !user.isAdmin && !user.isManager && user.active,
  )

  const onFiltersChange = (changes: $Any) => {
  }

  const onFiltersFinish = (changes: $Any) => {
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
          onClick={() => setShowDialog(true)}
        />
        <SaveButton
          icon="add"
          label="Add access"
          disabled={!actionEnabled}
          onClick={() => setShowDialog(true)}
        />
      </Toolbar>

      <Splitter layout="horizontal" style={{ height: '100%' }}>
        <SplitterPanel
          className="flex align-items-center justify-content-center"
          size={25}
          minSize={10}
        >
          {/* @ts-ignore */}
          <ProjectList selection={selectedProjects} onSelect={onSelectProjects} />
        </SplitterPanel>

        <SplitterPanel size={50}>
          <ProjectUserList
            header="Username"
            selectedUsers={selectedUsers}
            userList={filteredUsers}
            tableList={filteredUsers}
            isLoading={isLoading}
            onSelectUsers={(selection: string[]) => setSelectedUsers(selection)}
            sortable
          />
        </SplitterPanel>

        <SplitterPanel size={20}>
          <Splitter layout="vertical">
            {accessGroupList.map((accessGroup) => {
              return (
                <SplitterPanel
                  key={accessGroup.name}
                  className="flex align-items-center justify-content-center"
                  minSize={20}
                >
                  <ProjectUserList
                    header={accessGroup.name}
                    selectedUsers={[]}
                    userList={filteredUsers}
                    tableList={filteredUsers}
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
          onSave={() => {}}
          onClose={function (): void {
            setShowDialog(false)
          }}
        />
      )}
    </div>
  )
}
export default ProjectUsers
