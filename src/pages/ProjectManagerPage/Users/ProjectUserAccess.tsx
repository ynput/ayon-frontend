import { UserNode } from '@api/graphql'
import { $Any } from '@types'
import { Button, Toolbar } from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { useState } from 'react'
import ProjectUserAccessUserList from './ProjectUserAccessUserList'
import { useGetAccessGroupsQuery } from '@queries/accessGroups/getAccessGroups'
import ProjectUserAccessAssignDialog from './ProjectUserAccessAssignDialog'
import { SelectedAccessGroupUsers } from './types'
import { useProjectAccessGroupData } from './hooks'
import { toast } from 'react-toastify'
import { useGetUsersQuery } from '@queries/user/getUsers'
import {
  getAccessGroupUsers,
  getAllProjectUsers,
  getFilteredAccessGroups,
  getFilteredProjects,
  getFilteredUsers,
  getSelectedUsers,
  mapUsersByAccessGroups,
} from './mappers'
import { useSelector } from 'react-redux'
import EmptyPlaceholder from '@components/EmptyPlaceholder/EmptyPlaceholder'
import styled from 'styled-components'
import ProjectUserAccessSearchFilterWrapper from './ProjectUserAccessSearchFilterWrapper'
import ProjectUserAccessProjectList from './ProjectUserAccessProjectList'
import { Filter } from '@components/SearchFilter/types'
import { AccessGroupObject } from '@api/rest/accessGroups'

const StyledButton = styled(Button)`
  .shortcut {
    padding: 4px;
    background-color: var(--md-sys-color-primary-container-dark);
    border-radius: var(--border-radius-m);
  }
`
const ProjectUserAccess = () => {
  const { data: accessGroupList = [] } = useGetAccessGroupsQuery({
    projectName: '_',
  })

  const {
    users: projectUsers,
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
  const unassignedUsers = activeNonManagerUsers.filter(
    (user: UserNode) => !allProjectUsers.includes(user.name),
  )

  const [actionedUsers, setActionedUsers] = useState<string[]>([])
  const [showDialog, setShowDialog] = useState<boolean>(false)
  const [filters, setFilters] = useState<$Any>([])
  const [selectedAccessGroupUsers, setSelectedAccessGroupUsers] = useState<
    SelectedAccessGroupUsers | undefined
  >()

  const filteredSelectedProjects = getFilteredProjects(
    selectedProjects,
    filters.find((filter: Filter) => filter.label === 'Project'),
  )

  const filteredUnassignedUsers = getFilteredUsers(
    unassignedUsers,
    filters?.find((el: Filter) => el.label === 'User'),
  )
  const selectedUsers = getSelectedUsers(selectedAccessGroupUsers, filteredUnassignedUsers)

  const addActionEnabled = filteredSelectedProjects.length > 0 && selectedUsers.length > 0
  const removeActionEnabled =
    filteredSelectedProjects.length > 0 &&
    getSelectedUsers(selectedAccessGroupUsers, [], true).length > 0 &&
    selectedAccessGroupUsers?.accessGroup != undefined

  const handleAdd = (user?: string) => {
    setActionedUsers(user ? [user] : selectedUsers)
    setShowDialog(true)
  }

  const updateSelectedAccessGroupUsers = (accessGroup: string, selectedUsers: string[]) => {
    setSelectedAccessGroupUsers({ accessGroup, users: selectedUsers })
  }

  const resetSelectedUsers = () => setSelectedAccessGroupUsers({ users: [] })

  const onSave = async (changes: $Any, users: string[]) => {
    const errorMessage = await updateUserAccessGroups(users, changes)
    if (errorMessage) {
      toast.error(errorMessage)
    } else {
      toast.success('Operation successful')
    }
    resetSelectedUsers()
  }

  const onRemove = (accessGroup: string) => async (user?: string) => {
    if (user) {
      await removeUserAccessGroup(user, accessGroup)
    } else {
      for (const user of selectedAccessGroupUsers!.users) {
        await removeUserAccessGroup(user, accessGroup)
      }
    }
    toast.success('Operation successful')
    resetSelectedUsers()
  }

  return (
    <div style={{ height: '100%' }}>
      <Toolbar style={{ display: 'flex', margin: '4px 0' }}>
        {/* @ts-ignore */}
        <ProjectUserAccessSearchFilterWrapper
          filters={filters}
          onChange={(results: $Any) => setFilters(results)}
        />
        <StyledButton
          className="action"
          disabled={!addActionEnabled}
          data-tooltip={false ? 'No project selected' : undefined}
          icon={'add'}
          onClick={(e) => {
            e.stopPropagation()
            setActionedUsers(selectedUsers)
            setShowDialog(true)
          }}
        >
          Add <span className="shortcut">A</span>{' '}
        </StyledButton>

        <StyledButton
          className="action"
          icon={'remove'}
          disabled={!removeActionEnabled}
          onClick={(e) => {
            e.stopPropagation()
            setActionedUsers(selectedUsers)
            onRemove(selectedAccessGroupUsers!.accessGroup!)()
          }}
        >
          Remove <span className="shortcut">R</span>{' '}
        </StyledButton>
      </Toolbar>

      <Splitter layout="horizontal" style={{ height: '100%' }}>
        <SplitterPanel
          className="flex align-items-center justify-content-center"
          size={25}
          minSize={10}
        >
          {/* @ts-ignore */}
          <ProjectUserAccessProjectList
            selection={filteredSelectedProjects}
            onSelectionChange={setSelectedProjects}
          />
        </SplitterPanel>

        <SplitterPanel size={50}>
          {filteredSelectedProjects.length > 0 ? (
            <ProjectUserAccessUserList
              header="Username"
              emptyMessage="All users assigned"
              selectedProjects={filteredSelectedProjects}
              selectedUsers={selectedUsers}
              tableList={filteredUnassignedUsers}
              isLoading={isLoading}
              onAdd={handleAdd}
              onSelectUsers={(selection) => setSelectedAccessGroupUsers({ users: selection })}
              sortable
              isUnassigned
            />
          ) : (
            <EmptyPlaceholder message={'No project selected'} icon={'list'}>
              <span style={{ textAlign: 'center' }}>
                Select a project on the left side to manage users access groups
              </span>
            </EmptyPlaceholder>
          )}
        </SplitterPanel>
        <SplitterPanel size={20}>
          {filteredSelectedProjects.length > 0 && (
            <Splitter layout="vertical" style={{ overflowY: 'scroll', overflowX: 'hidden' }}>
              {getFilteredAccessGroups(accessGroupList, filters)
                .map((item: AccessGroupObject) => item.name)
                .map((accessGroup) => {
                  const selectedUsers = getAccessGroupUsers(selectedAccessGroupUsers!, accessGroup)
                  return (
                    <SplitterPanel
                      style={{ minHeight: '250px', minWidth: '350px' }}
                      key={accessGroup}
                      className="flex align-items-center justify-content-center"
                      size={45}
                    >
                      <ProjectUserAccessUserList
                        selectedProjects={filteredSelectedProjects}
                        selectedUsers={selectedUsers}
                        header={accessGroup}
                        emptyMessage="No users assigned"
                        tableList={activeNonManagerUsers.filter(
                          (user: UserNode) =>
                            mappedUsers[accessGroup] &&
                            mappedUsers[accessGroup].includes(user.name),
                        )}
                        onSelectUsers={(selection: string[]) =>
                          updateSelectedAccessGroupUsers(accessGroup, selection)
                        }
                        onAdd={() => {
                          setActionedUsers(selectedUsers)
                          setShowDialog(true)
                        }}
                        onRemove={onRemove(accessGroup)}
                        isLoading={isLoading}
                      />
                    </SplitterPanel>
                  )
                })}
            </Splitter>
          )}
        </SplitterPanel>
      </Splitter>

      {showDialog && (
        <ProjectUserAccessAssignDialog
          users={actionedUsers}
          userAccessGroups={mappedUsers}
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
export default ProjectUserAccess
