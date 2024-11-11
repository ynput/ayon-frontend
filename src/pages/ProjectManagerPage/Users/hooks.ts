import { $Any } from "@types"
import api, { useGetProjectsUsersQuery } from '@queries/project/getProject'
import { useState } from "react"
import { useUpdateProjectUsersMutation } from "@queries/project/updateProject"
import { useDispatch } from "react-redux"
import { SelectionStatus } from "./types"
import { Option } from "@components/SearchFilter/types"

type FilterValues = {
  id: string,
  label: string
}

const useProjectAccessGroupData = () => {

  const udpateApiCache = (project: string, user: string, accessGroups: string[]) => {
    dispatch(api.util.invalidateTags([{ type: 'project', id: project }]))
    dispatch(
      // @ts-ignore
      api.util.updateQueryData(
        'getProjectsUsers',
        { projects: [project]},
        (draft: $Any) => {
          draft[project][user] = accessGroups
        },
      ),
    )
  }

  const dispatch = useDispatch()
  const [updateUser] = useUpdateProjectUsersMutation()

  const [selectedProjects, setSelectedProjects] = useState<string[]>([])

  const result = useGetProjectsUsersQuery({ projects: selectedProjects })
  const users = result.data

  const accessGroupUsers: $Any = {}
  const removeUserAccessGroup = (user: string, accessGroup: string) => {
    for (const project of selectedProjects) {
      // @ts-ignore
      const updatedAccessGroups = users![project][user].filter((item: string) => item !== accessGroup)
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

  const updateUserAccessGroups = async (selectedUsers: $Any, changes: {name: string, status: SelectionStatus}[] ): Promise<string | void> => {
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

    for (const user of selectedUsers) {
      // @ts-ignore
      const accessGroups = updatedAccessGroups(users?.[user] || [], changes)

        for (const project of selectedProjects) {
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
  [key: string]: FilterValues[]
}) => {
  const options: Option[] = [
    { id: 'project', label: 'Project', icon: 'deployed_code', values: projects, allowsCustomValues: true },
    { id: 'user', label: 'User', icon: 'person', values: users, allowsCustomValues: true },
    { id: 'accessGroup', label: 'Access Group', icon: 'key', values: accessGroups, allowsCustomValues: true },
  ]

  return options
}

export { useProjectAccessGroupData, useProjectAccessSearchFilterBuiler }
