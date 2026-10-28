import { UserPoolModel } from '@shared/api'
import { ColumnSortEvent } from 'primereact/column'
import PrimeReact from 'primereact/api'
import { ObjectUtils } from 'primereact/utils'
import { getInvitationState } from './InvitationStatusHelpers'

/**
 * Sort function for user pool/license column
 * Groups items into 3 categories:
 * 1. Has pool and label found
 * 2. Has pool but label not found (cancelled/invalid)
 * 3. No pool (null/undefined)
 */
export const userPoolSortFunction = (event: ColumnSortEvent, userPools: UserPoolModel[]) => {
  return event.data.sort((a: any, b: any) => {
    const aPool = userPools?.find((p) => p?.id === a?.userPool)?.label
    const bPool = userPools?.find((p) => p?.id === b?.userPool)?.label

    // Create priority groups
    const aGroup = aPool ? 1 : a?.userPool ? 2 : 3
    const bGroup = bPool ? 1 : b?.userPool ? 2 : 3

    // Sort by group first
    if (aGroup !== bGroup) {
      return event.order === 1 ? aGroup - bGroup : bGroup - aGroup
    }

    // If both are in group 1 (found pools), sort by label
    if (aGroup === 1 && bGroup === 1) {
      // @ts-ignore
      return event.order === 1 ? aPool?.localeCompare(bPool) : bPool?.localeCompare(aPool)
    }

    // Keep original order for items in same group
    return 0
  })
}

import { UserModel } from '@shared/api'

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

const INVITE_SORT_RANK = { none: 0, expired: 1, pending: 2, accepted: 3 }

const inviteStatusSortFunction = (event: ColumnSortEvent) => {
  const { data, order } = event
  return [...data].sort((a, b) => {
    const diff = INVITE_SORT_RANK[getInvitationState(a)] - INVITE_SORT_RANK[getInvitationState(b)]
    return order === 1 ? diff : -diff
  })
}

// the sort functions of the table columns that don't sort by their field value
const getUserSortFunctions = (
  userPools: UserPoolModel[],
): Record<string, (event: ColumnSortEvent) => any[]> => ({
  userPool: (event) => userPoolSortFunction(event, userPools),
  accessLevel: accessGroupsSortFunction,
  inviteSentAt: inviteStatusSortFunction,
})

// the users table's DataTable state (stateKey), saved by the table on every change
export const USERS_TABLE_STATE_KEY = 'users-datatable'

export const getUsersTableState = (): {
  sortField?: string
  sortOrder?: 1 | -1 | 0 | null
  columnOrder?: string[]
} => {
  try {
    return JSON.parse(localStorage.getItem(USERS_TABLE_STATE_KEY) || '{}')
  } catch {
    return {}
  }
}

// the users in the table's order: the column's sort function, or the DataTable's default sort
const sortUsers = <T extends object>(users: T[], userPools: UserPoolModel[]): T[] => {
  const { sortField, sortOrder } = getUsersTableState()
  if (!sortField || !sortOrder) return users
  const sortFunction = getUserSortFunctions(userPools)[sortField]
  if (sortFunction) return sortFunction({ data: [...users], field: sortField, order: sortOrder })
  return [...users].sort((a, b) =>
    ObjectUtils.sort(
      ObjectUtils.resolveFieldData(a, sortField),
      ObjectUtils.resolveFieldData(b, sortField),
      sortOrder,
      PrimeReact.locale ?? 'en',
    ),
  )
}

export { accessGroupsSortFunction, getUserSortFunctions, sortUsers }
