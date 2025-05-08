import { useGetProjectsInfoQuery } from '@shared/api'
import type { ProjectModel, Status } from '@shared/api'
import { intersectionBy } from 'lodash'

type EntityStatus = Status & {
  scope?: string[]
}

export const useScopedStatuses = (projects: string[], entityTypes: string[]) => {
  const response = useGetProjectsInfoQuery({ projects: [...new Set(projects).values()] })

  if (!response || !response.data) {
    return []
  }

  let currentStatuses: EntityStatus[] | undefined
  for (const item of Object.values(response.data) as ProjectModel[]) {
    const filteredStatuses = item.statuses!.filter((status: EntityStatus) =>
      entityTypes.every((type) => (!status.scope || status.scope!.includes(type))),
    )
    if (currentStatuses === undefined) {
      currentStatuses = filteredStatuses
      continue
    }
    currentStatuses = intersectionBy(currentStatuses, filteredStatuses, 'name')
  }

  return currentStatuses
}

export const filterProjectStatuses = (statuses: EntityStatus[], entityTypes: string[]) => {
  let statusesList: EntityStatus[] = Object.values(statuses || {})

  if (statusesList.length == 0 || statusesList[0].scope === undefined) {
    return statusesList
  }

  return statusesList.filter((el) => entityTypes.every((type) => el.scope!.includes(type)))
}
