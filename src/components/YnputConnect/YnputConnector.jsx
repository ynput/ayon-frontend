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
import { useLocation } from 'react-router'
import { useSelector } from 'react-redux'

const YnputConnector = ({
  onConnection,
  showLoading = false,
  hideSignOut,
  disabled,
  redirect,
  onRedirect,
  showDropdown = true,
  initIsOpen = false,
  showStatus = true,
  showDisconnect = true,
  smallLogo = false,
  onClick,
  styleContainer,
  user,
  ...props
}) => {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(initIsOpen)
  const currentUser = useSelector((state) => state.user)
  const [queryKey, setQueryKey] = useQueryParam('key', withDefault(StringParam, ''))
  const {
    data: connectData,
    isLoading,
    isError,
  } = useGetYnputConnectionsQuery({}, { skip: !currentUser.name })

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

  redirect = redirect || location.pathname
  const redirectUrl = `${window.location.origin}${redirect}`
  const loginUrl = `/api/connect/authorize?origin_url=${redirectUrl}`

  const handleConnect = () => {
    // redirect to login url
    window.location.href = loginUrl
  }

  const handleDisconnect = async () => {
    setIsOpen(false)
    disconnect()
  }

  const handleClick = (event) => {
    event?.preventDefault()
    onClick && onClick(event)
    if (!disabled && !isConnected) {
      handleConnect()
    } else if (showDropdown) {
      setIsOpen(!isOpen)
    }
  }

  return (
    <Styled.Container style={styleContainer} $darkMode={props.darkMode}>
      <YnputConnectButton
        disabled={disabled}
        isLoading={isLoadingConnect || isLoading}
        onClick={handleClick}
        showStatus={showStatus}
        showDropdown={showDropdown}
        isConnected={isConnected}
        isOpen={isOpen}
        smallLogo={smallLogo}
        {...props}
      />

      <Styled.DropdownContainer $isOpen={isOpen}>
        <Styled.Dropdown className="dropdown">
          <span>Name: {connectData?.userName || user?.name}</span>
          <span>Email: {connectData?.userEmail || user?.email}</span>
          {showDisconnect && (
            <Styled.Footer>
              <Styled.Button onClick={handleDisconnect} className="disconnect">
                Disconnect
              </Styled.Button>
            </Styled.Footer>
          )}
        </Styled.Dropdown>
      </Styled.DropdownContainer>
    </Styled.Container>
  )
}

export default YnputConnector
