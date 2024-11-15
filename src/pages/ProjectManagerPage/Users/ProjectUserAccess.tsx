import { ProjectNode, UserNode } from '@api/graphql'
import { $Any } from '@types'
import { Button, Toolbar } from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { useEffect, useMemo, useState } from 'react'
import ProjectUserAccessUserList from './ProjectUserAccessUserList'
import { useGetAccessGroupsQuery } from '@queries/accessGroups/getAccessGroups'
import ProjectUserAccessAssignDialog from './ProjectUserAccessAssignDialog'
import { HoveredUser, SelectedAccessGroupUsers, SelectionStatus } from './types'
import { useProjectAccessGroupData, userPageFilters } from './hooks'
import { toast } from 'react-toastify'
import { useGetUsersQuery } from '@queries/user/getUsers'
import {
  canAllEditUsers,
  getAccessGroupUsers,
  getAllProjectUsers,
  getFilteredAccessGroups,
  getFilteredProjects,
  getFilteredSelectedProjects,
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
import { useListProjectsQuery } from '@queries/project/getProject'
import useUserProjectPermissions, { UserPermissionsEntity } from '@hooks/useUserProjectPermissions'
import ProjectManagerPageLayout from '../ProjectManagerPageLayout'
import { StyledEmptyPlaceholder, StyledEmptyPlaceholderWrapper } from './ProjectUserAccess.styled'
import useCreateContext from '@hooks/useCreateContext'
import Shortcuts from '@containers/Shortcuts'
import { useShortcutsContext } from '@context/shortcutsContext'

const StyledHeader = styled.p`
  font-size: 16px;
  line-height: 24px;
  font-weight: 700;
  margin: 8px 0;
`

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

  const [filters, setFilters] = userPageFilters()

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
  const [selectedAccessGroupUsers, setSelectedAccessGroupUsers] = useState<
    SelectedAccessGroupUsers | undefined
  >()
  const [hoveredUser, setHoveredUser] = useState<HoveredUser | undefined>()

  const { data: projects, isLoading: projectsIsLoading, isError, error } = useListProjectsQuery({})
  if (isError) {
    console.error(error)
  }

  const { setDisabled } = useShortcutsContext()
  const isUser = useSelector((state: $Any) => state.user.data.isUser)
  const userPermissions = useUserProjectPermissions(!isUser)

  const projectFilters = (filters || []).find((filter: Filter) => filter.label === 'Project')
  const filteredProjects = getFilteredProjects(
    // @ts-ignore Weird one, the response type seems to be mismatched?
    (projects || []).filter(
      (project: ProjectNode) =>
        project.active && userPermissions?.canView(UserPermissionsEntity.users, project.name),
    ),
    projectFilters,
  )
  const filteredSelectedProjects = getFilteredSelectedProjects(selectedProjects, filteredProjects)

  const userFilter = filters?.find((el: Filter) => el.label === 'User')
  const filteredNonManagerUsers = getFilteredUsers(activeNonManagerUsers, userFilter)
  const filteredUnassignedUsers = getFilteredUsers(unassignedUsers, userFilter)
  const selectedUnassignedUsers = getSelectedUsers(selectedAccessGroupUsers, filteredUnassignedUsers)

  const hasEditRightsOnProject =
    filteredSelectedProjects.length > 0 &&
    canAllEditUsers(filteredSelectedProjects, userPermissions)
  const addActionEnabled = hasEditRightsOnProject && selectedUnassignedUsers.length > 0
  const removeActionEnabled = hasEditRightsOnProject &&
  getSelectedUsers(selectedAccessGroupUsers, [], true).length > 0 &&
    selectedAccessGroupUsers?.accessGroup != undefined

  const filteredAccessGroups = getFilteredAccessGroups(
    accessGroupList,
    filters.find((filter: Filter) => filter.label === 'Access Group'),
  )

  const [ctxMenuShow] = useCreateContext([])

  const handleAddContextMenu = (e: $Any) => {
    let actionedUsers = selectedUnassignedUsers
    if (!actionedUsers.includes(e.data.name)) {
      actionedUsers = [e.data.name]
      setSelectedAccessGroupUsers({ users: [e.data.name] })
    }

    ctxMenuShow(e.originalEvent, [
      {
        id: 'add',
        icon: 'add',
        label: 'Add access',
        command: () => handleAdd(actionedUsers),
      },
      {
        id: 'remove',
        icon: 'remove',
        label: 'Remove access',
        disabled: true,
        command: () => handleAdd(actionedUsers),
      },
      {
        id: 'remove_all',
        icon: 'remove_moderator',
        label: 'Remove all access',
        disabled: true,
        command: () => onRemove()(actionedUsers),
      },
    ])
  }

  const handleRemoveContextMenu = (e: $Any, accessGroup: string) => {
    let actionedUsers = selectedAccessGroupUsers?.users || []
    if (!actionedUsers.includes(e.data.name)) {
      actionedUsers = [e.data.name]
      setSelectedAccessGroupUsers({ users: [e.data.name] })
    }

    ctxMenuShow(e.originalEvent, [
      {
        id: 'add',
        icon: 'add',
        label: 'Add access',
        command: () => handleAdd(actionedUsers),
      },
      {
        id: 'remove',
        icon: 'remove',
        label: 'Remove access',
        command: () => onRemove(accessGroup)(actionedUsers),
      },
      {
        id: 'remove',
        icon: 'remove_moderator',
        label: 'Remove all access',
        command: () => onRemove()(actionedUsers),
      },
    ])
  }

  const handleAdd = (users?: string[]) => {
    const selectedUsers = getSelectedUsers(selectedAccessGroupUsers, filteredNonManagerUsers)
    // Selection is picked based on access group being set or not. Might be redundant, check later if is necessary
    const actionedUsers = users
      ? users
      : selectedAccessGroupUsers?.accessGroup
      ? selectedUsers
      : selectedUnassignedUsers
    setActionedUsers(actionedUsers)
    if (filteredAccessGroups.length == 1) {
      onSave(actionedUsers, [{ name: filteredAccessGroups[0].name, status: SelectionStatus.All }])

      return
    }

    setShowDialog(true)
  }

  const updateSelectedAccessGroupUsers = (accessGroup: string, selectedUsers: string[]) => {
    setSelectedAccessGroupUsers({ accessGroup, users: selectedUsers })
  }

  const resetSelectedUsers = () => setSelectedAccessGroupUsers({ users: [] })

  const onSave = async (users: string[], changes: $Any) => {
    const errorMessage = await updateUserAccessGroups(users, changes)
    if (errorMessage) {
      toast.error(errorMessage)
    } else {
      toast.success('Access added')
    }
    resetSelectedUsers()
  }

  const onRemove = (accessGroup?: string) => async (users?: string[]) => {
    const userList = users ? users : selectedAccessGroupUsers!.users
    for (const user of userList) {
      await removeUserAccessGroup(user, accessGroup)
    }
    toast.success('Access removed')
    resetSelectedUsers()
  }

  useEffect(() => {
    setDisabled(['a+a'])
    return () => {
      setDisabled([])
    }
  }, [])

  const shortcuts = useMemo(
    () => [
      {
        key: 'a',
        action: () => {
          if(!selectedAccessGroupUsers?.users || hoveredUser?.user) {
            return
          }
          handleAdd(selectedAccessGroupUsers?.users)
        },
      },
      {
        key: 'r',
        action: () => {
          if (!selectedAccessGroupUsers?.users || !hoveredUser?.accessGroup) {
            return
          }

          onRemove(hoveredUser!.accessGroup!)([hoveredUser.user])
        },
      },
    ],
    [hoveredUser],
  )

  const handleProjectSelectionChange = (selection: string[]) => {
    if (selection.length <= 1) {
      setSelectedProjects(selection)
      return
    }

    const filteredSelection = selection.filter((projectName) =>
      userPermissions?.canEdit(UserPermissionsEntity.users, projectName),
    )
    setSelectedProjects(filteredSelection)
  }

  if (!userPermissions?.canViewAny(UserPermissionsEntity.users)) {
    return (
      <EmptyPlaceholder
        message="You don't have permissions to view the this project's users"
        icon="person"
      />
    )
  }

  return (
    // @ts-ignore
    <ProjectManagerPageLayout style={{ height: '100%'}} sectionStyle={{gap: 0}}>
      {/* @ts-ignore */}
      <Shortcuts shortcuts={shortcuts} deps={[selectedProjects, selectedAccessGroupUsers, hoveredUser]} />
      <Toolbar style={{ display: 'flex', margin: '0' }}>
        {/* @ts-ignore */}
        <ProjectUserAccessSearchFilterWrapper
          filters={filters}
          projects={filteredProjects}
          users={activeNonManagerUsers}
          onChange={(results: $Any) => setFilters(results)}
        />
        <StyledButton
          className="action"
          disabled={!addActionEnabled}
          data-tooltip={false ? 'No project selected' : undefined}
          icon={'add'}
          onClick={() => handleAdd()}
        >
          Add access
        </StyledButton>

        <StyledButton
          className="action"
          icon={'remove'}
          disabled={!removeActionEnabled}
          onClick={(e) => {
            e.stopPropagation()
            setActionedUsers(selectedUnassignedUsers)
            onRemove(selectedAccessGroupUsers!.accessGroup!)()
          }}
        >
          Remove access
        </StyledButton>
      </Toolbar>

      <Splitter layout="horizontal" style={{ height: '100%', overflow: 'hidden' }}>
        <SplitterPanel
          className="flex align-items-center justify-content-center"
          size={25}
          minSize={10}
        >
          <StyledHeader>Projects</StyledHeader>
          <ProjectUserAccessProjectList
            selection={filteredSelectedProjects}
            // @ts-ignore
            projects={filteredProjects}
            isLoading={projectsIsLoading}
            userPermissions={userPermissions}
            onSelectionChange={handleProjectSelectionChange}
          />
        </SplitterPanel>

        <SplitterPanel size={50}>
          <StyledHeader>No project access</StyledHeader>

          {filteredSelectedProjects.length > 0 ? (
            <div style={{ position: 'relative', height: '100%' }}>
              <ProjectUserAccessUserList
                header="User"
                emptyMessage="All users assigned"
                selectedProjects={filteredSelectedProjects}
                selectedUsers={selectedUnassignedUsers}
                tableList={filteredUnassignedUsers}
                isLoading={isLoading}
                readOnly={!hasEditRightsOnProject}
                onContextMenu={handleAddContextMenu}
                onAdd={handleAdd}
                onHoverRow={(userName: string) => setHoveredUser({ user: userName })}
                onSelectUsers={(selection) => setSelectedAccessGroupUsers({ users: selection })}
                sortable
                isUnassigned
              />
            </div>
          ) : (
            <StyledEmptyPlaceholderWrapper>
              <StyledEmptyPlaceholder message={'No project selected'} icon={'list'}>
                <span style={{ textAlign: 'center' }}>
                  Select a project on the left side to manage users access groups
                </span>
              </StyledEmptyPlaceholder>
            </StyledEmptyPlaceholderWrapper>
          )}
        </SplitterPanel>
        <SplitterPanel
          size={50}
          style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
          <StyledHeader>Access groups</StyledHeader>
          {filteredSelectedProjects.length > 0 ? (
            <Splitter layout="vertical" style={{ height: '100%', overflow: 'auto' }}>
              {filteredAccessGroups
                .map((item: AccessGroupObject) => item.name)
                .map((accessGroup) => {
                  return (
                    <SplitterPanel
                      style={{
                        minHeight: '250px',
                        minWidth: '350px',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                      key={accessGroup}
                      className="flex align-items-center justify-content-center"
                      size={45}
                    >
                      <ProjectUserAccessUserList
                        selectedProjects={filteredSelectedProjects}
                        selectedUsers={getAccessGroupUsers(selectedAccessGroupUsers!, accessGroup)}
                        header={accessGroup}
                        readOnly={!hasEditRightsOnProject}
                        showAddMoreButton={filteredAccessGroups.length > 1}
                        emptyMessage="No users assigned"
                        onContextMenu={(e: $Any) => handleRemoveContextMenu(e, accessGroup)}
                        tableList={filteredNonManagerUsers.filter(
                          (user: UserNode) =>
                            mappedUsers[accessGroup] &&
                            mappedUsers[accessGroup].includes(user.name),
                        )}
                        onHoverRow={(userName: string) =>
                          setHoveredUser({ accessGroup, user: userName })
                        }
                        onSelectUsers={(selection: string[]) =>
                          updateSelectedAccessGroupUsers(accessGroup, selection)
                        }
                        onAdd={() => handleAdd()}
                        onRemove={onRemove(accessGroup)}
                        isLoading={isLoading}
                      />
                    </SplitterPanel>
                  )
                })}
            </Splitter>
          ) : (
            <StyledEmptyPlaceholderWrapper />
          )}
        </SplitterPanel>
      </Splitter>

      {showDialog && (
        <ProjectUserAccessAssignDialog
          users={actionedUsers}
          userAccessGroups={mappedUsers}
          accessGroups={filteredAccessGroups.map((item) => ({ ...item, selected: false }))}
          onSave={onSave}
          onClose={function (): void {
            setShowDialog(false)
          }}
        />
      )}
    </ProjectManagerPageLayout>
  )
}
export default ProjectUserAccess
