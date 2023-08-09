import { useEffect } from 'react'
import { Button, Panel, Section } from '@ynput/ayon-react-components'
import { StringParam, useQueryParam, withDefault } from 'use-query-params'
import YnputConnectButton from '/src/components/YnputConnectButton'
import {
  useConnectYnputMutation,
  useDiscountYnputMutation,
  useGetYnputConnectionsQuery,
} from '/src/services/ynputConnect'
import LoadingPage from '../pages/LoadingPage'

const YnputConnector = ({
  onConnection,
  showLoading = true,
  hideSignOut,
  disabled,
  redirect = '/settings/connect',
  onRedirect,
  ...props
}) => {
  const [queryKey, setQueryKey] = useQueryParam('key', withDefault(StringParam, ''))
  const { data: connectData, isLoading, isError } = useGetYnputConnectionsQuery()

  const [connect, { isLoading: isLoadingConnect }] = useConnectYnputMutation()
  const [disconnect] = useDiscountYnputMutation()

  const signOut = () => {
    disconnect()
  }

  useEffect(() => {
    if (queryKey) {
      setQueryKey(undefined)
      onRedirect && onRedirect(queryKey)
      connect({ key: queryKey })
        .unwrap()
        .then((res) => {
          console.log('ynput account connected', res)
          onConnection && onConnection(res)
        })
    }
  }, [queryKey])

  useEffect(() => {
    if (!isLoading && onConnection) {
      if (!isError && connectData && onConnection) {
        onConnection(true)
      } else {
        onConnection(false)
      }
    }
  }, [isLoading, isError, connectData, onConnection])

  if (isLoading && showLoading)
    return (
      <Section style={{ position: 'relative', height: '100%' }}>
        <LoadingPage style={{ position: 'absolute' }} />
      </Section>
    )

  if (connectData && !isError) {
    if (hideSignOut) return null
    return (
      <Panel>
        <h1>Connected to Ynput</h1>
        <p>Ynput account: {connectData.userEmail}</p>
        <Button onClick={signOut}>Sign out</Button>
      </Panel>
    )
  }

  const redirectUrl = `${window.location.origin}${redirect}`
  const loginUrl = `/api/connect/authorize?origin_url=${redirectUrl}`
  return (
    <a href={disabled ? '#' : loginUrl} {...props} className=".ynput-connector">
      <YnputConnectButton disabled={disabled} isLoading={isLoadingConnect} />
    </a>
  )
}

export default YnputConnector
