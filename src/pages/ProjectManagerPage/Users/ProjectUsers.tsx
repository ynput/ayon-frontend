import { UserNode } from '@api/graphql'
import UserAccessGroups from '@pages/SettingsPage/UsersSettings/UserAccessGroupsForm/UserAccessGroups/UserAccessGroups'
import { useGetUsersQuery } from '@queries/user/getUsers'
import { $Any } from '@types'
import { Button, SaveButton, Section, Spacer, Toolbar } from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import ProjectUserList from './UserList'
import SearchFilter from '@components/SearchFilter/SearchFilter'
import { Filter } from '@components/SearchFilter/types'
import UserAccessGroupsProjects from '@pages/SettingsPage/UsersSettings/UserAccessGroupsForm/UserAccessGroupsProjects/UserAccessGroupsProjects'
import { getProjectsListForSelection } from '@pages/SettingsPage/UsersSettings/UserAccessGroupsForm/UserAccessGroupsHelpers'
import { useListProjectsQuery } from '@queries/project/getProject'
import { useGetAccessGroupsQuery } from '@queries/accessGroups/getAccessGroups'

type Props = {}

const ProjectUsers = ({}: Props) => {
  const selfName = useSelector((state: $Any) => state.user.name)
  let { data: userList = [], isLoading } = useGetUsersQuery({ selfName })

  const { data: projectsList = [] } = useListProjectsQuery({})

  // console.log({userList})
  const filteredUsers = userList.filter(
    (user: UserNode) => !user.isAdmin && !user.isManager && user.active,
  )
  // console.log({filteredUsers})

  const accessGroups = {
    artist: ['project_a', 'project_b', 'project_c'],
    freelancer: [],
    supervisor: [],
  }

  // Load user list
  const { data: accessGroupList = [] } = useGetAccessGroupsQuery({
    projectName: '_',
  })

  const { allProjects, activeProjects } = getProjectsListForSelection(
    [],
    accessGroups,
  )

  const [localActiveProjects, setLocalActiveProjects] = useState<$Any[]>(activeProjects)

  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedAccessGroups, setSelectedAccessGroups] = useState<$Any>([])

  // keeps track of the filters whilst adding/removing filters
  const [filters, setFilters] = useState<Filter[]>([
    { id: 'user_filter', type: 'string', label: 'user' },
    { id: 'project_filter', type: 'string', label: 'project' },
  ])

  const onFiltersChange = (changes: $Any) => {
    console.log('on change? ', changes)
  }

  const onFiltersFinish = (changes: $Any) => {
    console.log('on filters finish: ', changes)
  }

  return (
    <div style={{ height: '100%' }}>
      <Toolbar style={{ display: 'flex', margin: '4px 0' }}>
        <SearchFilter
          filters={filters}
          onChange={(v) => onFiltersChange(v)}
          onFinish={(v) => onFiltersFinish(v)} // when changes are applied
          options={[]}
        />
        <Spacer />
        <Button
          icon="clear"
          label="Clear All Changes"
          // onClick={handleRevert}
          // disabled={!canCommit}
        />
        <SaveButton
          label="Save Changes"
          // onClick={onCommit}
          // active={canCommit}
          // saving={commitUpdating}
        />
      </Toolbar>
      <Splitter layout="horizontal" style={{ width: '100%', height: '100%' }}>
        <SplitterPanel size={80} style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
          <Section>
            <ProjectUserList
              selectedProjects={[]}
              selectedUsers={selectedUsers}
              userList={filteredUsers}
              tableList={filteredUsers}
              isLoading={isLoading}
              onSelectUsers={(selection: string[]) => setSelectedUsers(selection)}
            />
          </Section>
        </SplitterPanel>
        <SplitterPanel size={200} style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
          <Section>
            <UserAccessGroups
              values={accessGroups}
              selected={selectedAccessGroups}
              onChange={(selection: $Any) => {
                console.log('ag selection: ', selection)
                return setSelectedAccessGroups(selection)
              }}
              disableNewGroup={false}
            />
          </Section>
          <Section>
            {/* @ts-ignore */}
            {/*}
            <ProjectList
              selection={selectedProjects}
              onSelectionChange={(selection: $Any) => {
                console.log('selection: ', selection)
                return setSelectedProjects(selection)
              }}
            />
            {*/}

            <UserAccessGroupsProjects
              // @ts-ignore
              values={allProjects}
              // @ts-ignore
              activeValues={localActiveProjects}
              selectedAG={selectedAccessGroups}
              // @ts-ignore
              options={projectsList}
              onChange={(p: any, clearAll: any) => {
                console.log('changes...', p, clearAll)
                setLocalActiveProjects(p)
              }}
              isDisabled={!selectedAccessGroups.length}
            />
          </Section>
        </SplitterPanel>
      </Splitter>
    </div>
  )
}
export default ProjectUsers
