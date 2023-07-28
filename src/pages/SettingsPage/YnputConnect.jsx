import axios from 'axios'
import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Button, Panel } from '@ynput/ayon-react-components'
import { StringParam, useQueryParam, withDefault } from 'use-query-params'

const LoginButton = styled.a`
  padding: 8px 12px;
  height: 40px;
  max-height: unset;
  border-radius: 6px;
  background-color: #00d7a0;
  display: flex;
  color: black;
  align-items: center;
  justify-content: center;
`

const YnputConnector = () => {
  const [shouldDisplayLogin, setShouldDisplayLogin] = useState(false)
  const [queryKey, setQueryKey] = useQueryParam('key', withDefault(StringParam, ''))
  const [connectData, setConnectData] = useState(null)

  const signOut = () => {
    axios.delete('/api/connect').then(() => {
      setConnectData(null)
      setShouldDisplayLogin(true)
    })
  }

  const loadConnectData = () => {
    axios
      .get('/api/connect')
      .then((res) => {
        setConnectData(res.data)
      })
      .catch(() => {
        setShouldDisplayLogin(true)
      })
  }

  useEffect(() => {
    if (queryKey) {
      //setAyonKey(queryKey)
      setQueryKey(undefined)
      axios.post('/api/connect', { key: queryKey }).then(() => {
        loadConnectData()
      })
    }
  }, [queryKey])

  useEffect(() => {
    loadConnectData()
  }, [])

  if (connectData) {
    return (
      <Panel>
        <h1>Connected to Ynput</h1>
        <p>Ynput account: {connectData.email}</p>
        <Button onClick={signOut}>Sign out</Button>
      </Panel>
    )
  }

  if (shouldDisplayLogin) {
    const redirectUrl = `${window.location.origin}/settings/connect`
    const loginUrl = `https://auth.ayon.cloud/login?origin_url=${redirectUrl}`
    return (
      <Panel>
        <h1>YnputConnect</h1>
        <LoginButton href={loginUrl}>Connect to Ynput account</LoginButton>
      </Panel>
    )
  }
}

const YnputConnect = () => {
  return (
    <main style={{ alignItems: 'center', justifyContent: 'center' }}>
      <YnputConnector />
    </main>
  )
}

export default YnputConnect
