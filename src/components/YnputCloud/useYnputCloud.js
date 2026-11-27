import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { StringParam, useQueryParam, withDefault } from 'use-query-params'
import { isBefore } from 'date-fns'
import {
  useConnectYnputMutation,
  useDiscountYnputMutation,
  useGetYnputConnectionsQuery,
} from '@queries/ynputConnect'

const hasTrialExpired = (date) => {
  if (!date) return false
  const trialDate = new Date(date)
  return isBefore(trialDate, new Date())
}
const hasActiveSub = (subs) => {
  if (!subs) return false
  return subs.some((sub) => sub.productType === 'ayon' && !hasTrialExpired(sub.trialEnd))
}

/**
 * The server's Ynput Cloud connection. Connecting goes to Ynput Cloud, which sends the user back to
 * `redirect` with a `key`; the hook exchanges it. `enabled: false` turns all of it off.
 */
export const useYnputCloud = ({
  redirect,
  onConnection,
  onRedirect,
  skip,
  user,
  enabled = true,
} = {}) => {
  const location = useLocation()
  const currentUser = useSelector((state) => state.user)
  const [queryKey, setQueryKey] = useQueryParam('key', withDefault(StringParam, ''))
  const {
    data: connectData,
    isLoading,
    isError,
  } = useGetYnputConnectionsQuery({}, { skip: !currentUser.name || skip || !enabled })

  const [connect, { isLoading: isLoadingConnect }] = useConnectYnputMutation()
  const [disconnect] = useDiscountYnputMutation()

  useEffect(() => {
    if (enabled && queryKey) {
      setQueryKey(undefined)
      onRedirect && onRedirect(queryKey)

      connect({ key: queryKey })
        .unwrap()
        .then((res) => {
          console.log('ynput account connected', res)
          onConnection && onConnection(res, hasActiveSub(res.subscriptions))
        })
    }
  }, [queryKey])

  useEffect(() => {
    if (!isLoading && onConnection) {
      if (!isError && connectData?.connected && onConnection) {
        onConnection(true, hasActiveSub(connectData.subscriptions))
      } else {
        onConnection(false, false)
      }
    }
  }, [isLoading, isError, connectData, onConnection])

  const productName = useMemo(() => {
    if (!connectData?.subscriptions?.length) return

    return connectData.subscriptions.find((sub) => sub.productType === 'ayon')?.name
  }, [connectData])

  const isConnected = (connectData?.connected && !isError) || user

  const redirectUrl = `${window.location.origin}${redirect || location.pathname}`
  const loginUrl = `/api/connect/authorize?origin_url=${redirectUrl}`

  const handleConnect = () => {
    // redirect to login url
    window.location.href = loginUrl
  }

  return {
    connectData,
    isLoading,
    isLoadingConnect,
    isConnected,
    productName,
    handleConnect,
    disconnect,
  }
}
