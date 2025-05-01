import { toast } from 'react-toastify'
import styled from 'styled-components'
import { useSelector } from 'react-redux'
import { useEffect, useMemo, useState } from 'react'
import { $Any } from '@types'
import { Button, Filter, Toolbar } from '@ynput/ayon-react-components'
import Shortcuts from '@containers/Shortcuts'
import { useShortcutsContext } from '@context/shortcutsContext'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import useUserProjectPermissions from '@hooks/useUserProjectPermissions'
import { useGetAccessGroupsQuery } from '@queries/accessGroups/getAccessGroups'
import { useGetUsersQuery } from '@queries/user/getUsers'
import { useListProjectsQuery } from '@queries/project/getProject'

import ProjectManagerPageLayout from '../ProjectManagerPageLayout'
import {
  canAllEditUsers,
  getAccessGroupUsers,
  getErrorInfo,
  getFilteredEntities,
  getFilteredSelectedProjects,
  getSelectedUsers,
  getUserAccessGroups,
  mapUsersByAccessGroups,
} from './mappers'
import { HoveredUser, SelectedAccessGroupUsers, SelectionStatus } from './types'
import {
  useUserPreferencesExpandedPanels,
  useProjectAccessGroupData,
  useUserPageFilters,
} from './hooks'
import ProjectUserAccessUserList from './ProjectUserAccessUserList'
import ProjectUserAccessAssignDialog from './ProjectUserAccessAssignDialog'
import ProjectUserAccessSearchFilterWrapper from './ProjectUserAccessSearchFilterWrapper'
import ProjectUserAccessProjectList from './ProjectUserAccessProjectList'
import {
  AccessGroupsWrapper,
  ProjectUserAccessUserListWrapper,
  StyledHeader,
} from './ProjectUserAccess.styled'
import SplitterContainerThreePanes from './SplitterThreePanes'
import SplitterContainerTwoPanes from './SplitterTwoPanes'
import { ProjectNode, UserNode } from '@shared/api'
import LoadingPage from '@pages/LoadingPage'
import { useQueryParam } from 'use-query-params'
import { uuid } from 'short-uuid'
import ProjectUserAccesAccessGroupPanel from './ProjectUserAccessAccessGroupPanel'
import {
  EmptyPlaceholderFlex,
  EmptyPlaceholderFlexWrapper,
} from '@shared/components/EmptyPlaceholder'

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

  const [selectedProject] = useQueryParam('project')

  const {
    isLoading: isLoadingAccessGroupsData,
    users: projectUsers,
    selectedProjects,
    setSelectedProjects,
    removeUserAccessGroup,
    updateUserAccessGroups,
  } = useProjectAccessGroupData(selectedProject as string)

  const [filters, setFilters] = useUserPageFilters()

  const [expandedAccessGroups, setExpandedAccessGroups] = useUserPreferencesExpandedPanels()
  const handleToggleExpandedAccessGroup = (accessGroupName: string, value: boolean) =>
    setExpandedAccessGroups({ ...expandedAccessGroups, [accessGroupName]: value })

  const selfName = useSelector((state: $Any) => state.user.name)
  let {
    data: userList = [],
    isLoading: isLoadingUsers,
    isError: usersFetchError,
  } = useGetUsersQuery({ selfName })

  const users = userList.filter((user: UserNode) => !user.isAdmin && !user.isManager && user.active)
  const mappedUsers = mapUsersByAccessGroups(projectUsers)

  const [actionedUsers, setActionedUsers] = useState<string[]>([])
  const [showDialog, setShowDialog] = useState<boolean>(false)
  const [selectedAccessGroupUsers, setSelectedAccessGroupUsers] = useState<
    SelectedAccessGroupUsers | undefined
  >()
  const [hoveredUser, setHoveredUser] = useState<HoveredUser | undefined>()

  const { data: projects, isLoading: isLoadingProjects, isError, error } = useListProjectsQuery({})
  if (isError) {
    console.error(error)
  }

  const { setDisabled } = useShortcutsContext()
  const isUser = useSelector((state: $Any) => state.user.data.isUser)
  const { isLoading: permissionsLoading, permissions: userPermissions } =
    useUserProjectPermissions(isUser)

  const projectFilters = (filters || []).filter((filter: Filter) => filter.label === 'Project')
  const filteredProjects = getFilteredEntities<ProjectNode>(
    // @ts-ignore Weird one, the response type seems to be mismatched?
    Array.from(projects || []),
    projectFilters,
  )
  const filteredSelectedProjects = getFilteredSelectedProjects(selectedProjects, filteredProjects)

  const userFilter = filters?.filter((el: Filter) => el.label === 'User')
  const filteredNonManagerUsers = getFilteredEntities<UserNode>(users, userFilter)
  const filteredUsers = getFilteredEntities<UserNode>(users, userFilter)
  const filteredUsersWithAccessGroups = getUserAccessGroups(
    filteredUsers,
    filteredSelectedProjects,
    //@ts-ignore
    projectUsers,
  )

  const selectedUsers = getSelectedUsers(selectedAccessGroupUsers, filteredUsersWithAccessGroups)

  const hasEditRightsOnProject =
    permissionsLoading ||
    (filteredSelectedProjects.length > 0 &&
      canAllEditUsers(filteredSelectedProjects, userPermissions))
  const addActionEnabled = hasEditRightsOnProject && selectedUsers.length > 0
  const removeActionEnabled =
    hasEditRightsOnProject &&
    getSelectedUsers(selectedAccessGroupUsers, [], true).length > 0 &&
    selectedAccessGroupUsers?.accessGroup != undefined

  const filteredAccessGroups = getFilteredEntities(
    accessGroupList,
    filters.filter((filter: Filter) => filter.label === 'Access Group'),
  )

  const [ctxMenuShow] = useCreateContextMenu([])

  const handleUserFilterUpdate = (actionedUsers: string[]) => {
    const otherFilters = filters.filter((filter: Filter) => filter.label !== 'User')
    const newFilterValues = (userFilter.values = users
      .filter((user: UserNode) => actionedUsers.includes(user.name))
      .map((user: $Any) => ({
        id: user.name,
        label: user.name,
        img: `/api/users/${user.name}/avatar`,
      })))
    let userFilters = filters.filter((filter) => filter.label === 'User')[0]
    setFilters([
      ...otherFilters,
      { icon: 'person', label: 'User', id: userFilters?.id || uuid(), values: newFilterValues },
    ])
  }

  const handleAddButton = () => {
    const { actionedUsers } = decideActionedUsers({
      interactionType: InteractionType.bulkButton,
    })

    handleAdd({ users: actionedUsers })
  }

  const handleRemoveButton = () => {
    const { accessGroup: actionedAccessGroup, actionedUsers } = decideActionedUsers({
      interactionType: InteractionType.bulkButton,
    })

    onRemove(actionedAccessGroup)(actionedUsers)
  }

  const handleRowAddButton = (data: { accessGroup?: string; users: string[] }) => {
    const { actionedUsers } = decideActionedUsers({
      accessGroup: data.accessGroup,
      users: data.users,
      interactionType: InteractionType.button,
    })

    handleAdd({ users: actionedUsers })
  }

  const handleContextMenu = (accessGroup?: string) => (e: $Any) => {
    const { actionedUsers } = decideActionedUsers({
      accessGroup,
      users: [e.data.name],
      interactionType: InteractionType.button,
    })

    let contextMenu = [
      {
        id: 'add',
        icon: 'add',
        label: 'Add access',
        command: () => handleAdd({ users: actionedUsers }),
      },
      {
        id: 'remove',
        icon: 'remove',
        label: 'Remove access',
        command: () => onRemove(accessGroup)(actionedUsers),
      },
      {
        id: 'remove_all',
        icon: 'remove_moderator',
        label: 'Remove all access',
        command: () => onRemove()(actionedUsers),
      },
      {
        id: 'filter_by_user',
        icon: 'person',
        label: 'Filter by user',
        command: () => handleUserFilterUpdate(actionedUsers),
      },
    ]
    if (accessGroup === undefined) {
      contextMenu = contextMenu.filter((item) => item.id !== 'remove')
    }

    ctxMenuShow(e.originalEvent, contextMenu)
  }

  const handleAdd = ({ users }: { users: string[] }) => {
    if (filteredAccessGroups.length == 1) {
      onSave(users, [{ name: filteredAccessGroups[0].name, status: SelectionStatus.All }])

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

  enum InteractionType {
    button = 'button',
    bulkButton = 'bulk',
    keyDown = 'keydown',
  }
  const decideActionedUsers = ({
    accessGroup,
    users,
    interactionType,
  }: {
    accessGroup?: string
    users?: string[]
    interactionType: InteractionType
  }): {
    accessGroup?: string
    actionedUsers: string[]
  } => {
    let actionedUsers = selectedAccessGroupUsers?.users || []
    let actionedAccessGroup = selectedAccessGroupUsers?.accessGroup

    if (interactionType == InteractionType.bulkButton) {
      if (hoveredUser?.user && !actionedUsers.includes(hoveredUser.user)) {
        actionedUsers = [hoveredUser.user]
        actionedAccessGroup = hoveredUser.accessGroup
        setSelectedAccessGroupUsers({
          accessGroup: hoveredUser.accessGroup,
          users: [hoveredUser.user],
        })
      }
    } else if (interactionType == InteractionType.button) {
      if (!actionedUsers.includes(users![0]) || accessGroup !== actionedAccessGroup) {
        actionedUsers = users!
        actionedAccessGroup = accessGroup
        setSelectedAccessGroupUsers({ accessGroup: actionedAccessGroup, users: users! })
      }
    }

    setActionedUsers(actionedUsers)
    return { accessGroup: actionedAccessGroup, actionedUsers }
  }

  const onRemove = (accessGroup?: string) => async (users?: string[]) => {
    const userList = users ? users : selectedAccessGroupUsers!.users
    await removeUserAccessGroup(userList, accessGroup)
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
          if (
            (!selectedAccessGroupUsers?.users || selectedAccessGroupUsers!.users.length == 0) &&
            !hoveredUser?.user
          ) {
            return
          }

          handleAddButton()
        },
      },
      {
        key: 'r',
        action: () => {
          if (!selectedAccessGroupUsers?.accessGroup && !hoveredUser?.accessGroup) {
            return
          }

          handleRemoveButton()
        },
      },
    ],
    [selectedAccessGroupUsers, hoveredUser],
  )

  const errorInfo = getErrorInfo(
    usersFetchError,
    filteredProjects,
    filteredSelectedProjects,
    userPermissions,
  )

  const projectsContent = (
    <>
      <StyledHeader>Projects</StyledHeader>
      <ProjectUserAccessProjectList
        selection={filteredSelectedProjects}
        projects={filteredProjects}
        isLoading={isLoadingProjects}
        // @ts-ignore
        userPermissions={userPermissions}
        onSelectionChange={setSelectedProjects}
      />
    </>
  )

  const usersContent = (
    <>
      <StyledHeader>All users</StyledHeader>
      <ProjectUserAccessUserListWrapper>
        <ProjectUserAccessUserList
          header="User"
          emptyMessage="All users assigned"
          selectedProjects={filteredSelectedProjects}
          selectedUsers={selectedAccessGroupUsers?.accessGroup ? [] : selectedUsers}
          tableList={filteredUsersWithAccessGroups}
          isLoading={isLoadingUsers || isLoadingAccessGroupsData}
          readOnly={!hasEditRightsOnProject}
          hoveredUser={hoveredUser}
          onContextMenu={(e: $Any) => handleContextMenu()(e)}
          onAdd={handleRowAddButton}
          onHoverRow={(userName: string) => {
            userName ? setHoveredUser({ user: userName }) : setHoveredUser({})
          }}
          onSelectUsers={(selection) => setSelectedAccessGroupUsers({ users: selection })}
          sortable
          showAddButton
          showAccessGroups
          shimmerEnabled
        />
      </ProjectUserAccessUserListWrapper>
    </>
  )

  const accessGroupsContent = (
    <>
      <StyledHeader>Access groups</StyledHeader>
      <AccessGroupsWrapper>
        {filteredAccessGroups
          .map((item: { name: string }) => item.name)
          .map((accessGroup) => {
            return (
              <ProjectUserAccesAccessGroupPanel
                key={`panel-${accessGroup}`}
                header={accessGroup}
                isExpanded={
                  expandedAccessGroups[accessGroup] !== undefined
                    ? expandedAccessGroups[accessGroup]
                    : true
                }
                onToggleExpand={(value: boolean) => {
                  handleToggleExpandedAccessGroup(accessGroup, value)
                }}
              >
                <ProjectUserAccessUserList
                  selectedProjects={filteredSelectedProjects}
                  selectedUsers={getAccessGroupUsers(selectedAccessGroupUsers!, accessGroup)}
                  readOnly={!hasEditRightsOnProject}
                  showAddMoreButton={filteredAccessGroups.length > 1}
                  hoveredUser={hoveredUser}
                  accessGroup={accessGroup}
                  emptyMessage="No users assigned"
                  onContextMenu={(e: $Any) => handleContextMenu(accessGroup)(e)}
                  tableList={filteredNonManagerUsers.filter(
                    (user: UserNode) =>
                      mappedUsers[accessGroup] && mappedUsers[accessGroup].includes(user.name),
                  )}
                  onHoverRow={(userName: string) =>
                    userName ? setHoveredUser({ accessGroup, user: userName }) : setHoveredUser({})
                  }
                  onSelectUsers={(selection: string[]) =>
                    updateSelectedAccessGroupUsers(accessGroup, selection)
                  }
                  onAdd={handleRowAddButton}
                  onRemove={onRemove(accessGroup)}
                  isLoading={isLoadingUsers}
                />
              </ProjectUserAccesAccessGroupPanel>
            )
          })}
      </AccessGroupsWrapper>
    </>
  )

  if (permissionsLoading || isLoadingUsers || isLoadingProjects) {
    return <LoadingPage message={''} children={''} />
  }

  return (
    // @ts-ignore
    <ProjectManagerPageLayout style={{ height: '100%' }} sectionStyle={{ gap: 0 }}>
      <Shortcuts
        // @ts-ignore
        shortcuts={shortcuts}
        // @ts-ignore
        deps={[selectedProjects, selectedAccessGroupUsers, hoveredUser]}
      />
      <Toolbar style={{ display: 'flex', margin: '0' }}>
        {/* @ts-ignore */}
        <ProjectUserAccessSearchFilterWrapper
          filters={filters}
          projects={filteredProjects}
          users={users}
          onChange={(results: $Any) => setFilters(results)}
        />
        <StyledButton
          className="action"
          disabled={!addActionEnabled}
          data-tooltip={false ? 'No project selected' : undefined}
          icon={'add'}
          onClick={() => handleAddButton()}
        >
          Add access
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
          Remove access
        </StyledButton>
      </Toolbar>

      {!errorInfo ? (
        <SplitterContainerThreePanes
          leftContent={projectsContent}
          mainContent={usersContent}
          rightContent={accessGroupsContent}
        />
      ) : (
        <SplitterContainerTwoPanes
          leftContent={projectsContent}
          mainContent={
            <EmptyPlaceholderFlexWrapper>
              <EmptyPlaceholderFlex message={errorInfo!.message} icon={errorInfo!.icon}>
                {errorInfo!.details && (
                  <span style={{ textAlign: 'center' }}>{errorInfo!.details!}</span>
                )}
              </EmptyPlaceholderFlex>
            </EmptyPlaceholderFlexWrapper>
          }
        />
      )}

      {showDialog && (
        <ProjectUserAccessAssignDialog
          users={actionedUsers}
          // @ts-ignore
          projectUsers={projectUsers}
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
