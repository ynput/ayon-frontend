import { $Any } from '@types'
import api, { useGetProjectsUsersQuery } from '@queries/project/getProject'
import { useState } from 'react'
import { useUpdateProjectUsersMutation } from '@queries/project/updateProject'
import { useDispatch } from 'react-redux'
import { SelectionStatus } from './types'
import { Filter, FilterValue, Option } from '@components/SearchFilter/types'
import { useAppSelector } from '@state/store'
import { useSetFrontendPreferencesMutation } from '@queries/user/updateUser'

const useProjectAccessGroupData = (selectedProject: string) => {
  const udpateApiCache = (project: string, user: string, accessGroups: string[]) => {
    dispatch(api.util.invalidateTags([{ type: 'project', id: project }]))
    dispatch(
      // @ts-ignore
      api.util.updateQueryData('getProjectsUsers', { projects: [project] }, (draft: $Any) => {
        draft[project][user] = accessGroups
      }),
    )
  }

  const dispatch = useDispatch()
  const [updateUser] = useUpdateProjectUsersMutation()

  const [selectedProjects, setSelectedProjects] = useState<string[]>(
    selectedProject ? [selectedProject] : [],
  )

  const result = useGetProjectsUsersQuery({ projects: selectedProjects })
  const users = result.data

  const accessGroupUsers: $Any = {}
  const removeUserAccessGroup = (user: string, accessGroup?: string) => {
    for (const project of selectedProjects) {
      // @ts-ignore
      if (!users![project][user]) {
        continue
      }
      // @ts-ignore
      const updatedAccessGroups = accessGroup ? users![project][user]?.filter(
        (item: string) => item !== accessGroup,
      ) : []
      try {
        updateUser({
          projectName: project,
          userName: user,
          update: updatedAccessGroups,
        })
        udpateApiCache(project, user, updatedAccessGroups)
      } catch (error: $Any) {
        console.log(error)
        return error.details
      }
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

    for (const project of selectedProjects) {
      for (const user of selectedUsers) {
        // @ts-ignore
        const accessGroups = updatedAccessGroups(users?.[project][user] || [], changes)

        try {
          await updateUser({
            projectName: project,
            userName: user,
            update: accessGroups,
          }).unwrap()
          udpateApiCache(project, user, accessGroups)
        } catch (error: $Any) {
          console.log(error)
          return error.details
        }
      }
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

const useProjectAccessSearchFilterBuiler = ({
  projects,
  users,
  accessGroups,
}: {
  [key: string]: FilterValue[]
}) => {
  const options: Option[] = [
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

const userPageFilters = (): [filters: Filter[], setFilters: (value: Filter[]) => void] => {
  const pageId = 'project.settings.user.access_groups'
  const [updateUserPreferences] = useSetFrontendPreferencesMutation()
  const userName = useAppSelector((state) => state.user.name)
  const frontendPreferences = useAppSelector((state) => state.user.data.frontendPreferences)
  const frontendPreferencesFilters: {
    [pageId: string]: []
  } = frontendPreferences?.filters

  const filters = frontendPreferencesFilters?.[pageId] || []

  const setFilters = (value: Filter[]) => {
    const updatedUserFilters = { ...frontendPreferencesFilters, [pageId]: value}
    const updatedFrontendPreferences = { ...frontendPreferences, filters: updatedUserFilters }
    updateUserPreferences({ userName, patchData: updatedFrontendPreferences })
  }

  return [filters, setFilters]
}

export { useProjectAccessGroupData, useProjectAccessSearchFilterBuiler, userPageFilters }
