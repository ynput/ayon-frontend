import { useEffect, useState, useMemo } from 'react'
import { Button, Icon, Section } from '@ynput/ayon-react-components'
import { StringParam, useQueryParam, withDefault } from 'use-query-params'
import YnputCloudButton from './YnputCloudButton'
import {
  useConnectYnputMutation,
  useDiscountYnputMutation,
  useGetYnputConnectionsQuery,
} from '@queries/ynputConnect'
import LoadingPage from '@pages/LoadingPage'
import * as Styled from './YnputCloud.styled'
import { useLocation } from 'react-router'
import { useSelector } from 'react-redux'
import clsx from 'clsx'
import { isBefore } from 'date-fns'
import { Link } from 'react-router-dom'

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
  showStudioLink = false,
  smallLogo = false,
  onClick,
  styleContainer,
  user,
  darkMode,
  skip,
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
  } = useGetYnputConnectionsQuery({}, { skip: !currentUser.name || skip })

  const [connect, { isLoading: isLoadingConnect }] = useConnectYnputMutation()
  const [disconnect] = useDiscountYnputMutation()

  const hasTrialExpired = (date) => {
    if (!date) return false
    const trialDate = new Date(date)
    return isBefore(trialDate, new Date())
  }
  const hasActiveSub = (subs) => {
    if (!subs) return false
    return subs.some((sub) => sub.productType === 'ayon' && !hasTrialExpired(sub.trialEnd))
  }

  useEffect(() => {
    if (queryKey) {
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

  if (isLoading && showLoading)
    return (
      <Section style={{ position: 'relative', height: '100%' }}>
        <LoadingPage style={{ position: 'absolute' }} />
      </Section>
    )

  const isConnected = (connectData?.connected && !isError) || user

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

  if (isLoading) return null

  return (
    <Styled.Container
      style={styleContainer}
      className={clsx('connector', { darkMode: isConnected && darkMode })}
    >
      <YnputCloudButton
        disabled={disabled}
        isLoading={isLoadingConnect || isLoading}
        onClick={handleClick}
        showStatus={showStatus}
        showDropdown={showDropdown}
        isConnected={isConnected}
        isOpen={isOpen}
        smallLogo={smallLogo}
        darkMode={isConnected && darkMode}
        {...props}
      />
      <Styled.DropdownContainer $isOpen={isOpen}>
        <Styled.Dropdown className="dropdown">
          {productName && <span>{productName}</span>}
          <span>Instance: {connectData?.instanceName || '???'}</span>
          <span>Organization: {connectData?.orgName || '???'}</span>
          {showDisconnect && (
            <Styled.Footer>
              <Styled.Button
                onClick={handleDisconnect}
                className="disconnect"
                variant={darkMode ? 'surface' : 'tertiary'}
              >
                Disconnect
              </Styled.Button>
            </Styled.Footer>
          )}
        </Styled.Dropdown>
      </Styled.DropdownContainer>
      {showStudioLink && isConnected && (
        <Styled.Links>
          <Link to={`https://ynput.cloud/org/${connectData.orgName}`} target="_blank">
            <Button variant="tertiary">
              Ynput Cloud Account
              <Icon icon="arrow_right_alt" />
            </Button>
          </Link>
        </Styled.Links>
      )}
    </Styled.Container>
  )
}

export default YnputConnector
