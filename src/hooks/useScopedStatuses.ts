import { $Any } from '@types'
import { useSelector } from 'react-redux'

type EntityStatus = {
  name: string
  icon: string
  color: string
  state: string
  shortName: string
  scope?: string[]
}
const useScopedStatuses = (entityTypes: string[]) => {
  const { statuses } = useSelector((state: $Any) => state.project)
  let statusesList: EntityStatus[] = Object.values(statuses || {})

  return filterProjectStatuses(statusesList, entityTypes)
}

const filterProjectStatuses = (statuses: EntityStatus[], entityTypes: string[]) => {
  let statusesList: EntityStatus[] = Object.values(statuses || {})

  if (statusesList.length == 0 || statusesList[0].scope === undefined) {
    return statusesList
  }

  return statusesList.filter((el) => entityTypes.every((type) => el.scope!.includes(type)))
}

export { filterProjectStatuses }
export default useScopedStatuses