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

const YnputConnector = () => {
  const [queryKey, setQueryKey] = useQueryParam('key', withDefault(StringParam, ''))
  const { data: connectData, isLoading, isError } = useGetYnputConnectionsQuery()

  const [connect] = useConnectYnputMutation()
  const [disconnect] = useDiscountYnputMutation()

  const signOut = () => {
    disconnect()
  }

  useEffect(() => {
    if (queryKey) {
      //setAyonKey(queryKey)
      setQueryKey(undefined)

      connect({ key: queryKey })
    }
  }, [queryKey])

  if (isLoading)
    return (
      <Section style={{ position: 'relative', height: '100%' }}>
        <LoadingPage style={{ position: 'absolute' }} />
      </Section>
    )

  if (connectData && !isError) {
    return (
      <Panel>
        <h1>Connected to Ynput</h1>
        <p>Ynput account: {connectData.email}</p>
        <Button onClick={signOut}>Sign out</Button>
      </Panel>
    )
  }

  const redirectUrl = `${window.location.origin}/settings/connect`
  const loginUrl = `https://auth.ayon.cloud/login?origin_url=${redirectUrl}`
  return (
    <Panel>
      <a href={loginUrl}>
        <YnputConnectButton />
      </a>
    </Panel>
  )
}

const YnputConnect = () => {
  return (
    <main style={{ alignItems: 'center', justifyContent: 'center' }}>
      <YnputConnector />
    </main>
  )
}

export default YnputConnect
