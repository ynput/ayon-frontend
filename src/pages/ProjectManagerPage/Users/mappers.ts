import { AccessGroupObject } from '@api/rest/accessGroups'
import { AccessGroupUsers, SelectedAccessGroupUsers } from './types'
import { Filter } from '@components/SearchFilter/types'
import { UserNode } from '@api/graphql'
import { GetProjectUsersApiResponse } from '@api/rest/project'

const getAllProjectUsers = (groupedUsers: AccessGroupUsers): string[] => {
  let allUsers: string[] = []
  for (const [_, users] of Object.entries(groupedUsers)) {
    allUsers.push(...users)
  }

  return [...new Set(allUsers)]
}

const mapUsersByAccessGroups = (response: GetProjectUsersApiResponse | undefined): AccessGroupUsers => {
  if (!response) {
    return {}
  }

  const groupedUsers: { [key: string]: string[] } = {}
  for (const [_, projectData] of Object.entries(response)) {
    for (const [user, acessGroupsList] of Object.entries(projectData)) {
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

const getFilteredAccessGroups = (accessGroupList: AccessGroupObject[], filters: Filter[]) => {
  if (!filters) {
    return accessGroupList
  }
  const accessGroupFilters = filters?.find((el: Filter) => el.label === 'Access Group')
  if (!accessGroupFilters) {
    return accessGroupList
  }

  const filterProjects = filters && accessGroupFilters.values!.map((match: Filter) => match.id)
  if (accessGroupFilters!.inverted) {
    return accessGroupList.filter(
      (accessGroup: AccessGroupObject) => !filterProjects.includes(accessGroup.name),
    )
  }
  return accessGroupList.filter((accessGroup: AccessGroupObject) =>
    filterProjects.includes(accessGroup.name),
  )
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
    return selectedAccessGroupUsers!.users.filter((user: string) =>
      filteredUserNames.includes(user),
    )
  }

  const getAccessGroupUsers = (
    selectedAccessGroupUsers: SelectedAccessGroupUsers,
    accessGroup?: string,
  ): string[] => {
    if (!selectedAccessGroupUsers || !accessGroup) {
      return []
    }
    return selectedAccessGroupUsers.accessGroup === accessGroup
      ? selectedAccessGroupUsers.users
      : []
  }

  const getFilteredProjects = (projects: string[], filters: Filter) => {
    if (!filters) {
      return projects
    }

    const filterProjects = filters && filters.values!.map((match: Filter) => match.id)
    if (filters!.inverted) {
      return projects.filter((project) => !filterProjects.includes(project))
    }
    return projects.filter((project) => filterProjects.includes(project))
  }

  const getFilteredUsers = (users: UserNode[], filters?: Filter) => {
    const exactFilter = (users: UserNode[], filters: Filter) => {
      const filterUsers = filters && filters.values!.map((match: Filter) => match.id)
      if (filters!.inverted) {
        return users.filter((user: UserNode) => !filterUsers.includes(user.name))
      }
      return users.filter((user: UserNode) => filterUsers.includes(user.name))
    }

    const fuzzyFilter = (users: UserNode[], filters: Filter) => {
      const filterString = filters.values![0].id
      if (filters!.inverted) {
        return users.filter((user: UserNode) => user.name.indexOf(filterString) == -1)
      }
      return users.filter((user: UserNode) => user.name.indexOf(filterString) != -1)
    }

    if (!filters || !filters.values || filters.values.length == 0) {
      return users
    }

    if (filters.values!.length == 1 && filters.values[0]!.isCustom) {
      return fuzzyFilter(users, filters)
    }

    return exactFilter(users, filters)
  }

  export {
    mapUsersByAccessGroups,
    getAllProjectUsers,
    getFilteredAccessGroups,
    getSelectedUsers,
    getAccessGroupUsers,
    getFilteredProjects,
    getFilteredUsers,
  }
