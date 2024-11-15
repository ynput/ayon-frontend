import { AccessGroupObject } from '@api/rest/accessGroups'
import { AccessGroupUsers, SelectedAccessGroupUsers, SelectionStatus } from './types'
import { Filter } from '@components/SearchFilter/types'
import { ProjectNode, UserNode } from '@api/graphql'
import { GetProjectsUsersApiResponse } from '@queries/project/getProject'
import { UserPermissions, UserPermissionsEntity } from '@hooks/useUserProjectPermissions'
import { $Any } from '@types'

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

const getFilteredSelectedProjects = (projects: string[], filteredProjects: ProjectNode[] ) => {
  if (!filteredProjects) {
    return projects
  }

  const filteredProjectNames = filteredProjects.map(project => project.name)
  return projects.filter((project) => filteredProjectNames.includes(project))
}

const exactFilter = <T extends {name: string}>(entities: T[], filters: Filter): T[] => {
  const filterUsers = filters && filters.values!.map((match: Filter) => match.id)
  if (filters!.inverted) {
    return entities.filter((entity: T) => !filterUsers.includes(entity.name))
  }
  return entities.filter((entity: T) => filterUsers.includes(entity.name))
}

const fuzzyFilter = <T extends {name: string}>(entities: T[], filters: Filter): T[] => {
  const filterString = filters.values![0].id
  if (filters!.inverted) {
    return entities.filter((entity: T) => entity.name.indexOf(filterString) == -1)
  }
  return entities.filter((entity: T) => entity.name.indexOf(filterString) != -1)
}

const getFilteredProjects = (projects: ProjectNode[], filter?: Filter): ProjectNode[] => {
  if (!filter || !filter.values || filter.values.length == 0) {
    return projects
  }

  if (filter.values!.length == 1 && filter.values[0]!.isCustom) {
    return fuzzyFilter(projects, filter)
  }

  return exactFilter(projects, filter)
}

const getFilteredUsers = (users: UserNode[], filter?: Filter): UserNode[] => {
  if (!filter || !filter.values || filter.values.length == 0) {
    return users
  }

  if (filter.values!.length == 1 && filter.values[0]!.isCustom) {
    return fuzzyFilter(users, filter)
  }

  return exactFilter(users, filter)
}

const getFilteredAccessGroups = (
  accessGroupList: AccessGroupObject[],
  filter?: Filter,
): AccessGroupObject[] => {
  if (!filter || !filter.values || filter.values.length == 0) {
    return accessGroupList
  }
  if (filter.values!.length == 1 && filter.values[0]!.isCustom) {
    return fuzzyFilter(accessGroupList, filter)
  }

  return exactFilter(accessGroupList, filter)
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

export {
  canAllEditUsers,
  mapUsersByAccessGroups,
  getAllProjectUsers,
  getFilteredAccessGroups,
  getSelectedUsers,
  getAccessGroupUsers,
  getFilteredSelectedProjects,
  getFilteredProjects,
  getFilteredUsers,
  mapInitialAccessGroupStates,
}
