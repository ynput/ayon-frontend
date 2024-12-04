import { $Any } from '@types'
import api, { useGetProjectsAccessQuery } from '@queries/project/getProject'
import { api as accessApi } from '@api/rest/access'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { SelectionStatus } from './types'
import { Filter } from '@components/SearchFilter/types'
import { useAppSelector } from '@state/store'
import { useSetFrontendPreferencesMutation } from '@queries/user/updateUser'
import { useUpdateAccessGroupsMutation } from '@queries/accessGroups/updateAccessGroups'

const useProjectAccessGroupData = (selectedProject: string) => {

  const [selectedProjects, setSelectedProjects] = useState<string[]>(
    selectedProject ? [selectedProject] : [],
  )

  const [updateAcessGroups] = useUpdateAccessGroupsMutation()
  const result = useGetProjectsAccessQuery({ projects: selectedProjects })
  const users = result.data

  const accessGroupUsers: $Any = {}
  const removeUserAccessGroup = async (userList: string[], accessGroup?: string) => {
    let multiUpdateData: { [key: string]: { [key: string]: string[] } } = {}

    for (const user of userList) {
      for (const project of selectedProjects) {
        // @ts-ignore
        if (!users![project][user]) {
          continue
        }
        const updatedAccessGroups = accessGroup
          ? // @ts-ignore
            users![project][user]?.filter((item: string) => item !== accessGroup)
          : []
        multiUpdateData = {
          ...multiUpdateData,
          [user]: {
            ...multiUpdateData[user],
            [project]: updatedAccessGroups,
          },
        }
      }
    }
    try {
      updateAcessGroups({ payload: multiUpdateData })
    } catch (error: $Any) {
      console.log(error)
      return error.details
    }
  }

  const updateUserAccessGroups = async (
    selectedUsers: $Any,
    changes: { name: string; status: SelectionStatus }[],
  ): Promise<string | void> => {
    const updatedAccessGroups = (
      existing: string[],
      changes: { name: string; status: SelectionStatus }[],
    ): string[] => {
      const existingSet = new Set(existing)
      for (const change of changes) {
        if (change.status == SelectionStatus.All) {
          existingSet.add(change.name)
        } else {
          existingSet.delete(change.name)
        }
      }

      return [...existingSet]
    }

    let multiUpdateData: { [key: string]: { [key: string]: string[] } } = {}
    for (const user of selectedUsers) {
      for (const project of selectedProjects) {
        // @ts-ignore
        const accessGroups = updatedAccessGroups(users?.[project][user] || [], changes)
        multiUpdateData = {
          ...multiUpdateData,
          [user]: {
            ...multiUpdateData[user],
            [project]: accessGroups,
          },
        }
      }
    }

    try {
      updateAcessGroups({ payload: multiUpdateData })
    } catch (error: $Any) {
      console.log(error)
      return error.details
    }
  }

  return {
    users,
    accessGroupUsers,
    selectedProjects,
    setSelectedProjects,
    removeUserAccessGroup,
    updateUserAccessGroups,
  }
}

const useUserPageFilters = (): [filters: Filter[], setFilters: (value: Filter[]) => void] => {
  const pageId = 'project.settings.user.access_groups'
  const [updateUserPreferences] = useSetFrontendPreferencesMutation()
  const userName = useAppSelector((state) => state.user.name)
  const frontendPreferences = useAppSelector((state) => state.user.data.frontendPreferences)
  const frontendPreferencesFilters: {
    [pageId: string]: []
  } = frontendPreferences?.filters

  const filters = frontendPreferencesFilters?.[pageId] || []

  const setFilters = (value: Filter[]) => {
    const mergeTextFilters = (userFilters: Filter[], textFilter: Filter): Filter[] => {
      if (userFilters.length === 0) {
        return [{ icon: 'person', label: 'User', id: textFilter.id, values: textFilter.values }]
      }

      return [
        ...userFilters,
        { icon: 'person', label: 'User', id: textFilter.id, values: textFilter.values },
      ]
    }

    const textFilter = value.find((filter) => filter.label === 'Text')
    const textlessFilters = value.filter(
      (filter) => filter.label !== 'Text' && filter.label !== 'User',
    )
    let userFilters = value.filter((filter) => filter.label === 'User')
    let filteredValue = textlessFilters
    if (!textFilter || textFilter.values!.length === 0) {
      // No new filters, we return the existing ones
      filteredValue = [...textlessFilters, ...userFilters]
    } else {
      // new text filters, we merge && convert them to user custom filters
      filteredValue = [...textlessFilters, ...mergeTextFilters(userFilters, textFilter)]
    }
    const updatedUserFilters = { ...frontendPreferencesFilters, [pageId]: filteredValue }
    const updatedFrontendPreferences = { ...frontendPreferences, filters: updatedUserFilters }
    updateUserPreferences({ userName, patchData: updatedFrontendPreferences })
  }

  return [filters, setFilters]
}

const useUserPreferencesExpandedPanels = (): [
  expandedAccessGroups: { [key: string]: boolean },
  setExpandedAccessGroups: (values: { [key: string]: boolean }) => void,
] => {
  const pageId = 'project.settings.user.access_groups'
  const [updateUserPreferences] = useSetFrontendPreferencesMutation()
  const userName = useAppSelector((state) => state.user.name)
  const frontendPreferences = useAppSelector((state) => state.user.data.frontendPreferences)
  const pageExpandedAccessGroups: {
    [pageId: string]: {}
  } = frontendPreferences?.expandedAccessGroups

  const expandedAccessGroups = pageExpandedAccessGroups?.[pageId] || {}

  const setExpandedAccessGroups = (value: { [accessGroupName: string]: boolean }) => {
    const updatedData = { ...pageExpandedAccessGroups, [pageId]: value }
    const updatedFrontendPreferences = { ...frontendPreferences, expandedAccessGroups: updatedData }
    updateUserPreferences({ userName, patchData: updatedFrontendPreferences })
  }

  return [expandedAccessGroups, setExpandedAccessGroups]
}

export { useProjectAccessGroupData, useUserPageFilters, useUserPreferencesExpandedPanels }
