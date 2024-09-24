import { FC, useEffect, useState } from 'react'
import * as Styled from './TrialBanner.styled'
import clsx from 'clsx'
import getTrialDates from './helpers/getTrialDates'
import getSubscribeLink from './helpers/getSubscribeLink'
import { useGetYnputCloudInfoQuery } from '@queries/cloud/cloud'
import useCustomerlyChat from '@hooks/useCustomerly'
import { useAppSelector } from '@state/store'
import { Button } from '@ynput/ayon-react-components'

interface TrialBannerProps {}

const TrialBanner: FC<TrialBannerProps> = ({}) => {
  const user = useAppSelector((state) => state.user)
  const canManage = user.data.isAdmin || user.data.isManager
  const [hide, setHide] = useState(false)

  // when hidden, show again after 30 minutes
  const timeoutMins = 30
  useEffect(() => {
    if (hide) {
      const timer = setTimeout(() => {
        setHide(false)
      }, timeoutMins * 60 * 1000)
      return () => clearTimeout(timer)
    }
  }, [hide])

  const { data: connect } = useGetYnputCloudInfoQuery()
  const { isTrialing, left } = getTrialDates(connect?.subscriptions)

  useCustomerlyChat({
    position: { desktop: { side: 8, bottom: 52 }, mobile: { side: 8, bottom: 52 } },
    delay: 2000,
    disabled: !isTrialing,
  })

  //   check if there is a sub
  if (!connect?.instanceId) return null

  if (!isTrialing || !left) return null

  const { formatted, oneDay, oneHour } = left

  if (hide) return null

  const handleHideBanner = () => {
    setHide(true)
  }

  return (
    <Styled.TrialBanner className={clsx({ urgent: oneDay, critical: oneHour })}>
      <span>{formatted} left of free trial</span>
      {canManage && (
        <>
          <span>-</span>
          <a href={getSubscribeLink(connect.instanceId)} target="_blank" rel="noreferrer">
            <u>
              <span>subscribe to keep your data</span>
            </u>
          </a>
        </>
      )}
      {!oneDay && !oneHour && (
        <Button variant="tertiary" onClick={handleHideBanner} icon={'close'} />
      )}
    </Styled.TrialBanner>
  )
}

export default TrialBanner
