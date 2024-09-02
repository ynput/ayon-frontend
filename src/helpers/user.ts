import { UserModel } from '@api/rest/users'
import { ColumnSortEvent } from 'primereact/column'

type EnrichedUserModel = UserModel & {
  isAdmin: boolean
  isService: boolean
  isManager: boolean
  accessGroupList: string[]
}

const accessGroupsSortFunction = (sortEvent: ColumnSortEvent) => {
  // Early return while data is still loading
  if (sortEvent.data[0].isLoading) {
    return sortEvent.data
  }
  const adminFilter = (user: EnrichedUserModel) => user.isAdmin && !user.isService
  const managerFilter = (user: EnrichedUserModel) =>
    user.isManager && !user.isAdmin && !user.isService
  const serviceFilter = (user: EnrichedUserModel) => user.isService
  const othersFilter = (user: EnrichedUserModel) =>
    !user.isAdmin && !user.isManager && !user.isService

  const adminUsers = sortEvent.data.filter(
    (user: EnrichedUserModel) => user.active && adminFilter(user),
  )
  const managerUsers = sortEvent.data.filter(
    (user: EnrichedUserModel) => user.active && managerFilter(user),
  )
  const serviceUsers = sortEvent.data.filter(
    (user: EnrichedUserModel) => user.active && serviceFilter(user),
  )
  const otherUsers = sortEvent.data.filter(
    (user: EnrichedUserModel) => user.active && othersFilter(user),
  )

  const inactiveAdminUsers = sortEvent.data.filter(
    (user: EnrichedUserModel) => !user.active && adminFilter(user),
  )
  const inactiveManagerUsers = sortEvent.data.filter(
    (user: EnrichedUserModel) => !user.active && managerFilter(user),
  )
  const inactiveServiceUsers = sortEvent.data.filter(
    (user: EnrichedUserModel) => !user.active && serviceFilter(user),
  )
  const inactiveOtherUsers = sortEvent.data.filter(
    (user: EnrichedUserModel) => !user.active && othersFilter(user),
  )

  const sortOthersFunction = (a: EnrichedUserModel, b: EnrichedUserModel) => {
    const hasNoGroup = (user: EnrichedUserModel) =>
      user.accessGroupList.length == 1 && user.accessGroupList[0] == 'none'

    const aScore = hasNoGroup(a) ? 10 : 1
    const bScore = hasNoGroup(b) ? 10 : 1

    return aScore - bScore
  }

  otherUsers.sort(sortOthersFunction)
  inactiveOtherUsers.sort(sortOthersFunction)

  const sortedUsers = [...adminUsers, ...managerUsers, ...otherUsers, ...serviceUsers]

  const inactiveSortedUsers = [
    ...inactiveAdminUsers,
    ...inactiveManagerUsers,
    ...inactiveOtherUsers,
    ...inactiveServiceUsers,
  ]

  return [
    ...(sortEvent.order == 1 ? sortedUsers : sortedUsers.reverse()),
    ...(sortEvent.order == 1 ? inactiveSortedUsers : inactiveSortedUsers.reverse()),
  ]
}

export { accessGroupsSortFunction }
