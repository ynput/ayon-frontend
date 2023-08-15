import { useEffect, useState } from 'react'
import { Section } from '@ynput/ayon-react-components'
import { StringParam, useQueryParam, withDefault } from 'use-query-params'
import YnputConnectButton from './YnputConnectButton'
import {
  useConnectYnputMutation,
  useDiscountYnputMutation,
  useGetYnputConnectionsQuery,
} from '/src/services/ynputConnect'
import LoadingPage from '/src/pages/LoadingPage'
import * as Styled from './YnputConnect.styled'

const YnputConnector = ({
  onConnection,
  showLoading = false,
  hideSignOut,
  disabled,
  redirect = '/settings/connect',
  onRedirect,
  showDropdown = true,
  initIsOpen = false,
  showStatus = true,
  showDisconnect = true,
  onClick,
  styleContainer,
  user,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(initIsOpen)
  const [queryKey, setQueryKey] = useQueryParam('key', withDefault(StringParam, ''))
  const { data: connectData, isLoading, isError } = useGetYnputConnectionsQuery()

  const [connect, { isLoading: isLoadingConnect }] = useConnectYnputMutation()
  const [disconnect] = useDiscountYnputMutation()

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

  const isConnected = (connectData && !isError) || user

  if (isConnected && hideSignOut) return null

  const redirectUrl = `${window.location.origin}${redirect}`
  const loginUrl = `/api/connect/authorize?origin_url=${redirectUrl}`

  const handleConnect = () => {
    // redirect to login url
    window.location.href = loginUrl
  }

  const handleDisconnect = () => {
    disconnect()
  }

  const handleClick = (event) => {
    event?.preventDefault()
    onClick && onClick(event)
    if (!disabled && !isConnected && !showDropdown) {
      handleConnect()
    } else if (showDropdown) {
      setIsOpen(!isOpen)
    }
  }

  return (
    <Styled.Container style={styleContainer}>
      <YnputConnectButton
        disabled={disabled}
        isLoading={isLoadingConnect}
        onClick={handleClick}
        showStatus={showStatus}
        showDropdown={showDropdown}
        isConnected={isConnected}
        isOpen={isOpen}
        {...props}
      />
      {isOpen && (
        <Styled.Dropdown>
          <span>Name: {connectData?.userName || user?.name}</span>
          <span>Email: {connectData?.userEmail || user?.email}</span>
          <Styled.Footer>
            {showDisconnect && (
              <Styled.Button onClick={handleDisconnect} className="disconnect">
                Disconnect
              </Styled.Button>
            )}
          </Styled.Footer>
        </Styled.Dropdown>
      )}
    </Styled.Container>
  )
}

export default YnputConnector
