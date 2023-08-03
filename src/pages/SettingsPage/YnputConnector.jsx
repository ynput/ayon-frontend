import { useEffect } from 'react'
import { Button, Panel, Section } from '@ynput/ayon-react-components'
import { StringParam, useQueryParam, withDefault } from 'use-query-params'
import YnputConnectButton from '/src/components/YnputConnectButton'
import {
  useConnectYnputMutation,
  useDiscountYnputMutation,
  useGetYnputConnectionsQuery,
} from '/src/services/ynputConnect'
import LoadingPage from '../LoadingPage'

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

  const [connect] = useConnectYnputMutation()
  const [disconnect] = useDiscountYnputMutation()

  const signOut = () => {
    disconnect()
  }

  useEffect(() => {
    console.log(queryKey)
    if (queryKey) {
      //setAyonKey(queryKey)
      setQueryKey(undefined)
      onRedirect && onRedirect(queryKey)
      connect({ key: queryKey })
        .unwrap()
        .then((res) => {
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
      <main style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Panel>
          <h1>Connected to Ynput</h1>
          <p>Ynput account: {connectData.email}</p>
          <Button onClick={signOut}>Sign out</Button>
        </Panel>
      </main>
    )
  }

  const redirectUrl = `${window.location.origin}${redirect}`
  const loginUrl = `https://auth.ayon.cloud/login?origin_url=${redirectUrl}`
  return (
    <a href={disabled ? '#' : loginUrl} {...props} className=".ynput-connector">
      <YnputConnectButton disabled={disabled} />
    </a>
  )
}

export default YnputConnector
