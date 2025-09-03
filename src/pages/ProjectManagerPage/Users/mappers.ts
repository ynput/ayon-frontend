import { AccessGroupUsers, ListingError, SelectedAccessGroupUsers, SelectionStatus } from './types'
import { Filter, FilterValue, Option } from '@components/SearchFilter/types'
import { ProjectNode, UserNode } from '@shared/api'
import { UserPermissions, UserPermissionsEntity } from '@hooks/useUserProjectPermissions'
import { $Any } from '@types'
import { matchSorter } from 'match-sorter'
import { GetProjectsUsersApiResponse, ProjectUserData } from '@queries/accessGroups/getAccessGroups'

// Safe Set helpers – avoid relying on nonstandard Set.prototype methods
const setIntersection = <T>(a: Set<T>, b: Set<T>): Set<T> => {
  const out = new Set<T>()
  // iterate smaller set for perf
  const [small, large] = a.size <= b.size ? [a, b] : [b, a]
  for (const v of small) if (large.has(v)) out.add(v)
  return out
}

const setDifference = <T>(a: Set<T>, b: Set<T>): Set<T> => {
  const out = new Set<T>()
  for (const v of a) if (!b.has(v)) out.add(v)
  return out
}

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

const getFilteredEntities = <T extends { name: string }>(
  entities: T[],
  filters: Filter[] = [],
): T[] => {
  if (filters.length == 0) {
    return entities
  }

  let intersection: Set<T> | null = null
  for (const filter of filters) {
    let matches: T[] = []
    let matchesSet: Set<T>
    if (!filter.values) {
      continue
    }

    for (const filterItem of filter.values.filter(
      (filterValue: FilterValue) => filterValue.isCustom,
    )) {
      matches.push(...fuzzyFilter(entities, filterItem))
    }
    const exactMatches = exactFilter(
      entities,
      filter.values.filter((filterValue: FilterValue) => !filterValue.isCustom),
    )
    matches.push(...exactMatches)

    matchesSet = filter.inverted
      ? setDifference(new Set(entities), new Set(matches))
      : new Set(matches)

    if (intersection === null) {
      intersection = matchesSet
      continue
    }

    intersection = setIntersection(intersection, matchesSet)
  }

  return Array.from(intersection || [])
}

const canAllEditUsers = (projects: string[], userPermissions?: UserPermissions) => {
  for (const project of projects) {
    if (!userPermissions?.canEdit(UserPermissionsEntity.access, project)) {
      return false
    }
  }

  return true
}

const mapInitialAccessGroupStates = (
  accessGroups: $Any[],
  users: string[],
  projectUsers: ProjectUserData,
  userAccessGroups: AccessGroupUsers,
) => {
  const getStatus = (agName: string, users: string[], accessGroupUsers: string[]) => {
    const usersSet = new Set(users)
    const accessGroupUsersSet = new Set(accessGroupUsers)
    const intersection = setIntersection(usersSet, accessGroupUsersSet)
    const diff = setDifference(usersSet, accessGroupUsersSet)

    // No users in ag users
    if (intersection.size == 0) {
      return SelectionStatus.None
    }

    //All users / some users in ag users
    if (diff.size > 0) {
      return SelectionStatus.Mixed
    }

    for (const project in projectUsers) {
      for (const user of users) {
        if (!projectUsers[project][user]?.includes(agName)) {
          return SelectionStatus.Mixed
        }
      }
    }

    return SelectionStatus.All
  }

  const data: $Any = {}
  accessGroups.map((ag) => {
    if (userAccessGroups[ag.name] === undefined) {
      data[ag.name] = SelectionStatus.None
    } else {
      data[ag.name] = getStatus(ag.name, users, userAccessGroups[ag.name])
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
  if (usersFetchError) {
    return {
      icon: 'admin_panel_settings',
      message: 'Missing permissions',
      details: 'Project user management permissions are missing. Contact an admin for more info.',
    }
  }
  if (filteredSelectedProjects.length == 0) {
    return {
      icon: 'list',
      message: 'Select an active project to manage users its access groups',
    }
  }

  const nameMappedProjects = filteredProjects.reduce<{ [key: string]: ProjectNode }>(
    (acc, curr) => ({ ...acc, [curr.name]: curr }),
    {},
  )

  for (const project of filteredSelectedProjects) {
    if (!nameMappedProjects[project].active) {
      return {
        icon: 'list',
        message: 'Project disabled',
        details: 'Select an active project to manage users its access groups',
      }
    }

    if (
      !userPermissions?.canView(UserPermissionsEntity.access, project) &&
      !userPermissions?.canView(UserPermissionsEntity.access, project)
    ) {
      return {
        icon: 'person',
        message: 'Missing permissions',
        details: "You don't have permission to manage this project's users",
      }
    }
  }

  return null
}
const getUserAccessGroups = (
  users: UserNode[],
  selectedProjects: string[],
  projectUsersData?: ProjectUserData,
) => {
  const getAssignedAccessGroups = (projects: string[], userName: string) => {
    if (!projectUsersData) {
      return []
    }

    let accessGroupsList = []
    for (const project of projects) {
      accessGroupsList.push(...(projectUsersData?.[project]?.[userName] || []))
    }

    return Array.from(new Set(accessGroupsList))
  }

  const assignedInAllProjects = (userName: string, projects: string[], accessGroup: string) => {
    for (const project of projects) {
      if (
        !projectUsersData?.[project]?.[userName] ||
        !projectUsersData?.[project][userName]?.includes(accessGroup)
      ) {
        return false
      }
    }
    return true
  }

  const filteredUsersWithAccessGroups = users.map((user: UserNode) => {
    const assignedAccessGroups = getAssignedAccessGroups(selectedProjects, user.name)
    let assignedAccessGroupsList = assignedAccessGroups

    let weightedAccessGroupsList = []
    for (const agName of assignedAccessGroupsList) {
      weightedAccessGroupsList.push({
        accessGroup: agName,
        complete: assignedInAllProjects(user.name, selectedProjects, agName),
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

  return filteredUsersWithAccessGroups
}

const getProjectAccessSearchFilterBuiler = ({
  projects,
  users,
  accessGroups,
}: {
  [key: string]: FilterValue[]
}) => {
  const options: Option[] = [
    {
      id: 'text',
      label: 'Text',
      icon: 'manage_search',
      inverted: false,
      allowsCustomValues: true,
      values: [],
    },
    {
      id: 'project',
      label: 'Project',
      icon: 'deployed_code',
      values: projects,
      allowsCustomValues: true,
    },
    { id: 'user', label: 'User', icon: 'person', values: users, allowsCustomValues: true },
    {
      id: 'accessGroup',
      label: 'Access Group',
      icon: 'key',
      values: accessGroups,
      allowsCustomValues: true,
    },
  ]

  return options
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
  getUserAccessGroups,
  getProjectAccessSearchFilterBuiler,
}
