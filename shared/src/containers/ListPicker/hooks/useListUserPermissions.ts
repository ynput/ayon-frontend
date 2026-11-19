import { useMemo } from 'react'
import { useGetCurrentUserQuery } from '@shared/api'
import type { UserPermissions } from '../util/listAccessControl'

// The current user, for the list access checks in util/listAccessControl
export const useListUserPermissions = (): UserPermissions => {
  const { data: user } = useGetCurrentUserQuery()

  return useMemo(
    () => ({
      isAdmin: !!user?.data?.isAdmin,
      isManager: !!user?.data?.isManager,
      userName: user?.name ?? '',
    }),
    [user],
  )
}
