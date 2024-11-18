import { AccessGroupUsers, ListingError, SelectedAccessGroupUsers, SelectionStatus } from './types'
import { Filter, FilterValue } from '@components/SearchFilter/types'
import { ProjectNode, UserNode } from '@api/graphql'
import { GetProjectsUsersApiResponse } from '@queries/project/getProject'
import { UserPermissions, UserPermissionsEntity } from '@hooks/useUserProjectPermissions'
import { $Any } from '@types'
import { matchSorter } from 'match-sorter'

const getAllProjectUsers = (groupedUsers: AccessGroupUsers): string[] => {
  let allUsers: string[] = []
  for (const [_, users] of Object.entries(groupedUsers)) {
    allUsers.push(...users)
  }

  return [...new Set(allUsers)]
}

const mapUsersByAccessGroups = (
  response: GetProjectsUsersApiResponse | undefined,
): AccessGroupUsers => {
  if (!response) {
    return {}
  }

  const groupedUsers: { [key: string]: string[] } = {}
  for (const [_, projectData] of Object.entries(response)) {
    for (const [user, acessGroupsList] of Object.entries(projectData)) {
      // @ts-ignore
      for (const accessGroup of acessGroupsList) {
        if (groupedUsers[accessGroup] === undefined) {
          groupedUsers[accessGroup] = []
        }
        if (groupedUsers[accessGroup].includes(user)) {
          continue
        }
        groupedUsers[accessGroup].push(user)
      }
    }
  }

  return groupedUsers
}

const getSelectedUsers = (
  selectedAccessGroupUsers: SelectedAccessGroupUsers | undefined,
  filteredUsers: UserNode[],
  skipFiltering = false,
): string[] => {
  if (!selectedAccessGroupUsers) {
    return []
  }

  if (skipFiltering) {
    return selectedAccessGroupUsers.users
  }

  const filteredUserNames = filteredUsers.map((user: UserNode) => user.name)
  return selectedAccessGroupUsers!.users.filter((user: string) => filteredUserNames.includes(user))
}

const getAccessGroupUsers = (
  selectedAccessGroupUsers: SelectedAccessGroupUsers,
  accessGroup?: string,
): string[] => {
  if (!selectedAccessGroupUsers || !accessGroup) {
    return []
  }
  return selectedAccessGroupUsers.accessGroup === accessGroup ? selectedAccessGroupUsers.users : []
}

const getFilteredSelectedProjects = (projects: string[], filteredProjects: ProjectNode[]) => {
  if (!filteredProjects) {
    return projects
  }

  const filteredProjectNames = filteredProjects.map((project) => project.name)
  return projects.filter((project) => filteredProjectNames.includes(project))
}

const exactFilter = <T extends { name: string }>(
  entities: T[],
  filterValues: FilterValue[],
  inverted: boolean = false,
): T[] => {
  let matches: string[] = []
  if (filterValues) {
    matches.push(...filterValues.map((value: FilterValue) => value.id))
  }

  if (inverted) {
    return entities.filter((entity: T) => !matches.includes(entity.name))
  }

  return entities.filter((entity: T) => matches.includes(entity.name))
}

const fuzzyFilter = <T extends { name: string }>(
  entities: T[],
  filterValue: FilterValue,
  inverted: boolean = false,
): T[] => {
  const filterString = filterValue.id

  const matches = matchSorter(entities, filterString, { keys: ['name'] })
  if (inverted) {
    return entities.filter((entity: T) => !matches.includes(entity))
  }

  return entities.filter((entity: T) => matches.includes(entity))
}

const getFilteredEntities = <T extends {name: string}>(projects: T[], filters: Filter[] = []): T[] => {
  if (filters.length == 0) {
    return projects
  }

  let intersection: Set<T> | null = null
  for (const filter of filters) {
    let matches: T[] = []
    if (!filter.values) {
      continue
    }

    for (const filterItem of filter.values.filter((filterValue) => filterValue.isCustom)) {
      matches.push(...fuzzyFilter(projects, filterItem, filter.inverted))
    }
    const exactMatches = exactFilter(
      projects,
      filter.values.filter((filterValue) => !filterValue.isCustom),
      filter.inverted,
    )
    matches.push(...exactMatches)
    if (intersection === null) {
      intersection = new Set(matches)
      continue
    }

    intersection = intersection.intersection(new Set(matches))
  }

  return Array.from(intersection || [])
}

const canAllEditUsers = (projects: string[], userPermissions?: UserPermissions) => {
  for (const project of projects) {
    if (!userPermissions?.canEdit(UserPermissionsEntity.users, project)) {
      return false
    }
  }

  return true
}

const mapInitialAccessGroupStates = (
  accessGroups: $Any[],
  users: string[],
  userAccessGroups: AccessGroupUsers,
) => {
  const getStatus = (users: string[], accessGroupUsers: string[]) => {
    const usersSet = new Set(users)
    const accessGroupUsersSet = new Set(accessGroupUsers)
    const intersection = usersSet.intersection(accessGroupUsersSet)

    // No users in ag users
    if (intersection.size == 0) {
      return SelectionStatus.None
    }

    //All users / some users in ag users
    return intersection.size == usersSet.size ? SelectionStatus.All : SelectionStatus.Mixed
  }

  const data: $Any = {}
  accessGroups.map((ag) => {
    if (userAccessGroups[ag.name] === undefined) {
      data[ag.name] = SelectionStatus.None
    } else {
      data[ag.name] = getStatus(users, userAccessGroups[ag.name])
    }
  })

  return data
}

const getErrorInfo = (
  usersFetchError: boolean,
  filteredProjects: ProjectNode[],
  filteredSelectedProjects: string[],
  userPermissions?: UserPermissions,
): ListingError | null => {
  const projectDisabled =
    filteredSelectedProjects.length == 1 &&
    !filteredProjects.find((project: ProjectNode) => project.name == filteredSelectedProjects[0])!
      .active

  const missingPermissions =
    (filteredSelectedProjects.length == 1 &&
      !userPermissions?.canView(UserPermissionsEntity.users, filteredSelectedProjects[0])) ||
    !userPermissions?.canViewAny(UserPermissionsEntity.users)

  if (usersFetchError) {
    return {
      icon: 'admin_panel_settings',
      message: 'Missing permissions',
      details: 'Project user management permissions are missing. Contact an admin for more info.',
    }
  }

  if (missingPermissions) {
    return {
      icon: 'person',
      message: 'Missing permissions',
      details: "You don't have permissions to manage this project's users",
    }
  }

  if (projectDisabled) {
    return {
      icon: 'list',
      message: 'Project disabled',
      details: 'Select an active project to manage users its access groups',
    }
  }

  if (filteredSelectedProjects.length == 0) {
    return {
      icon: 'list',
      message: 'Select an active project to manage users its access groups',
    }
  }
  return null
}

export {
  canAllEditUsers,
  mapUsersByAccessGroups,
  getAllProjectUsers,
  getSelectedUsers,
  getAccessGroupUsers,
  getFilteredSelectedProjects,
  getFilteredEntities,
  mapInitialAccessGroupStates,
  getErrorInfo,
}
