import { AccessGroupObject } from '@api/rest/accessGroups'
import { AccessGroupUsers, SelectedAccessGroupUsers } from './types'
import { Filter } from '@components/SearchFilter/types'
import { ProjectNode, UserNode } from '@api/graphql'
import { GetProjectsUsersApiResponse } from '@queries/project/getProject'
import { UserPermissions, UserPermissionsEntity } from '@hooks/useUserProjectPermissions'

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

const getFilteredSelectedProjects = (projects: string[], filters: Filter) => {
  if (!filters) {
    return projects
  }

  const filterProjects = filters && filters.values!.map((match: Filter) => match.id)
  if (filters!.inverted) {
    return projects.filter((project) => !filterProjects.includes(project))
  }
  return projects.filter((project) => filterProjects.includes(project))
}

const exactFilter = <T extends {name: string}>(entities: T[], filters: Filter): T[] => {
  const filterUsers = filters && filters.values!.map((match: Filter) => match.id)
  if (filters!.inverted) {
    return entities.filter((entity: T) => !filterUsers.includes(entity.name))
  }
  return entities.filter((entity: T) => filterUsers.includes(entity.name))
}

const fuzzyFilter = <T extends {name: string}>(users: T[], filters: Filter): T[] => {
  const filterString = filters.values![0].id
  if (filters!.inverted) {
    return users.filter((user: T) => user.name.indexOf(filterString) == -1)
  }
  return users.filter((user: T) => user.name.indexOf(filterString) != -1)
}

const getFilteredProjects = (projects: ProjectNode[], filter: Filter): ProjectNode[] => {
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
  filter: Filter,
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
}
