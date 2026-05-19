import {
  useGetActiveUsersCountQuery,
  useGetCurrentUserQuery,
  useGetYnputCloudInfoQuery,
} from '@shared/api'
export const baseLink = 'https://ynput.cloud/free-trial'

// When there is something to subscribe to, send them to free trial page
// If they have already used their trial, they will be redirected to subscribe dialog
export const useFreeTrialLink = ({
  addon, // an addon they are trying to access, e.g. 'powerpack'
}: {
  addon?: string
}) => {
  const { data: currentUser } = useGetCurrentUserQuery()
  const canManage = currentUser?.data?.isAdmin || currentUser?.data?.isManager

  // get connected instance id (admin and manager only)
  const { data: connect } = useGetYnputCloudInfoQuery(undefined, { skip: !currentUser?.name })
  // get quantity of active users in ayon (admin and manager only)
  const { data: activeUsersCount } = useGetActiveUsersCountQuery(
    {},
    { skip: !canManage || !connect?.instanceId },
  )
  //   construct new URL
  const url = new URL(baseLink)

  const instanceId = connect?.instanceId
  const quantity = activeUsersCount || 10

  //   add quantity
  url.searchParams.append('seats', quantity.toString())
  //   add instance id if there is one
  if (instanceId) url.searchParams.append('instance_id', instanceId)
  // add addon if there is one
  if (addon) url.searchParams.append('addon', addon)

  return url.toString()
}
