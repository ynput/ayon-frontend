import { toast } from 'react-toastify'
import styled from 'styled-components'
import { useSelector } from 'react-redux'
import { useEffect, useMemo, useState } from 'react'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { $Any } from '@types'
import { Button, Toolbar } from '@ynput/ayon-react-components'
import { Filter } from '@components/SearchFilter/types'
import Shortcuts from '@containers/Shortcuts'
import { useShortcutsContext } from '@context/shortcutsContext'
import useCreateContext from '@hooks/useCreateContext'
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
  mapUsersByAccessGroups,
} from './mappers'
import { HoveredUser, SelectedAccessGroupUsers, SelectionStatus } from './types'
import { useProjectAccessGroupData, userPageFilters } from './hooks'
import ProjectUserAccessUserList from './ProjectUserAccessUserList'
import ProjectUserAccessAssignDialog from './ProjectUserAccessAssignDialog'
import ProjectUserAccessSearchFilterWrapper from './ProjectUserAccessSearchFilterWrapper'
import ProjectUserAccessProjectList from './ProjectUserAccessProjectList'
import { StyledEmptyPlaceholder, StyledEmptyPlaceholderWrapper, StyledHeader } from './ProjectUserAccess.styled'
import SplitterContainerThreePanes from './SplitterThreePanes'
import SplitterContainerTwoPanes from './SplitterTwoPanes'
import { ProjectNode, UserNode } from '@api/graphql'
import LoadingPage from '@pages/LoadingPage'
import { useQueryParam } from 'use-query-params'
import { uuid } from 'short-uuid'

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
    users: projectUsers,
    selectedProjects,
    setSelectedProjects,
    removeUserAccessGroup,
    updateUserAccessGroups,
  } = useProjectAccessGroupData(selectedProject as string)

  const [filters, setFilters] = userPageFilters()

  const selfName = useSelector((state: $Any) => state.user.name)
  let {
    data: userList = [],
    isLoading: usersLoading,
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

  const { data: projects, isLoading: projectsLoading, isError, error } = useListProjectsQuery({})
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
  const filteredUsersWithAccessGroups = filteredUsers.map((user: UserNode) => {
    const assignedInAllProjects = (accessGroup: string) => {
      for (const project of filteredSelectedProjects) {
        // @ts-ignore
        if (!user.accessGroups[project] || !user.accessGroups[project]!.includes(accessGroup)) {
          return false
        }
      }
      return true
    }
    const assignedAccessGroups = Object.keys(user.accessGroups).filter(ag => filteredSelectedProjects.includes(ag)).reduce(
      (acc: $Any, curr: string) => {
        // @ts-ignore
        return [...acc, ...user.accessGroups[curr]]
      },
      [],
    )
    let assignedAccessGroupsList = Array.from(new Set(assignedAccessGroups))

    let weightedAccessGroupsList = []
    for (const agName of assignedAccessGroupsList) {
      weightedAccessGroupsList.push({
        accessGroup: agName,
        complete: assignedInAllProjects(agName),
      })
    }
    weightedAccessGroupsList.sort((a, b) => {
      const aComplete = a.complete ? -10 : 10
      const bComplete = b.complete ? -10 : 10

      // @ts-ignore
      const nameComparison = a.accessGroup.localeCompare(b.accessGroup)
      return aComplete - bComplete + nameComparison
    })

    return { ...user, assignedAccessGroups: weightedAccessGroupsList }
  })

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

  const [ctxMenuShow] = useCreateContext([])

  const handleAddContextMenu = (e: $Any) => {
    let actionedUsers = selectedUsers
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
      {
        id: 'filter_by_user',
        icon: 'person',
        label: 'Filter by user',
        disabled: false,
        command: () => handleUserFilterUpdate(actionedUsers)
      },
    ])
  }

  const handleUserFilterUpdate = (actionedUsers: string[]) => {
    const otherFilters = filters.filter(filter => filter.label !== 'User')
    const newFilterValues = userFilter.values = users
      .filter((user: UserNode) => actionedUsers.includes(user.name))
      .map((user: $Any) => ({
        id: user.name,
        label: user.name,
        img: `/api/users/${user.name}/avatar`,
      }))
    let userFilters = filters.filter(filter => filter.label === 'User')[0]
    setFilters([
      ...otherFilters,
      { icon: 'person', label: 'User', id: userFilters?.id || uuid(), values: newFilterValues },
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
      : selectedUsers
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
          if (!selectedAccessGroupUsers?.users && !hoveredUser?.user) {
            return
          }
          let actionedUsers = selectedAccessGroupUsers?.users || []
          if (hoveredUser?.user && !actionedUsers.includes(hoveredUser.user)) {
            actionedUsers = [hoveredUser.user]
            setSelectedAccessGroupUsers({
              accessGroup: hoveredUser.accessGroup,
              users: [hoveredUser.user],
            })
          }

          handleAdd(actionedUsers)
        },
      },
      {
        key: 'r',
        action: () => {
          if (!selectedAccessGroupUsers?.accessGroup && !hoveredUser?.accessGroup) {
            return
          }

          let actionedUsers = selectedAccessGroupUsers?.users || []
          let actionedAccessGroup = selectedAccessGroupUsers?.accessGroup
          if (hoveredUser?.user && !actionedUsers.includes(hoveredUser.user)) {
            actionedUsers = [hoveredUser.user]
            actionedAccessGroup = hoveredUser.accessGroup
            setSelectedAccessGroupUsers({
              accessGroup: hoveredUser.accessGroup,
              users: [hoveredUser.user],
            })
          }

          onRemove(actionedAccessGroup)(actionedUsers)
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
        isLoading={projectsLoading}
        // @ts-ignore
        userPermissions={userPermissions}
        onSelectionChange={setSelectedProjects}
      />
    </>
  )

  const usersContent = (
    <>
      <StyledHeader>All users</StyledHeader>
      <div style={{ position: 'relative', height: '100%' }}>
        <ProjectUserAccessUserList
          header="User"
          emptyMessage="All users assigned"
          selectedProjects={filteredSelectedProjects}
          selectedUsers={selectedUsers}
          tableList={filteredUsersWithAccessGroups}
          isLoading={usersLoading}
          readOnly={!hasEditRightsOnProject}
          hoveredUser={hoveredUser}
          onContextMenu={handleAddContextMenu}
          onAdd={handleAdd}
          onHoverRow={(userName: string) => {
            userName ? setHoveredUser({ user: userName }) : setHoveredUser({})
          }}
          onSelectUsers={(selection) => setSelectedAccessGroupUsers({ users: selection })}
          sortable
          isUnassigned
          showAccessGroups
        />
      </div>
    </>
  )

  const accessGroupsContent = (
    <>
      <StyledHeader>Access groups</StyledHeader>
      <Splitter layout="vertical" style={{ height: '100%', overflow: 'auto' }}>
        {filteredAccessGroups
          .map((item: { name: string }) => item.name)
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
                  hoveredUser={hoveredUser}
                  accessGroup={accessGroup}
                  emptyMessage="No users assigned"
                  onContextMenu={(e: $Any) => handleRemoveContextMenu(e, accessGroup)}
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
                  onAdd={() => handleAdd()}
                  onRemove={onRemove(accessGroup)}
                  isLoading={usersLoading}
                />
              </SplitterPanel>
            )
          })}
      </Splitter>
    </>
  )

  if (permissionsLoading || usersLoading || projectsLoading) {
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
            <StyledEmptyPlaceholderWrapper>
              <StyledEmptyPlaceholder message={errorInfo!.message} icon={errorInfo!.icon}>
                {errorInfo!.details && (
                  <span style={{ textAlign: 'center' }}>{errorInfo!.details!}</span>
                )}
              </StyledEmptyPlaceholder>
            </StyledEmptyPlaceholderWrapper>
          }
        />
      )}

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
