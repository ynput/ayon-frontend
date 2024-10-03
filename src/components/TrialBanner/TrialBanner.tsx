import { FC } from 'react'
import * as Styled from './TrialBanner.styled'
import clsx from 'clsx'
import getTrialDates from './helpers/getTrialDates'
import getSubscribeLink from './helpers/getSubscribeLink'
import { useGetYnputCloudInfoQuery } from '@queries/cloud/cloud'
import useCustomerlyChat from '@hooks/useCustomerly'
import { useAppSelector } from '@state/store'
import { Button, Icon } from '@ynput/ayon-react-components'
import { useGetActiveUsersCountQuery } from '@queries/user/getUsers'
import useLocalStorage from '@hooks/useLocalStorage'

interface TrialBannerProps {}

const TrialBanner: FC<TrialBannerProps> = ({}) => {
  const user = useAppSelector((state) => state.user)
  const canManage = user.data.isAdmin || user.data.isManager

  const [snooze, setSnooze] = useLocalStorage('trialBannerSnooze', null)

  const { data: connect } = useGetYnputCloudInfoQuery()
  const { isTrialing, left } = getTrialDates(connect?.subscriptions)
  const { formatted, oneDay, oneHour } = left || {}

  const getIsSnoozing = () => {
    // snooze is in the future and not oneDay or oneHour left
    return snooze && snooze > new Date().getTime() && !oneDay && !oneHour
  }

  const isSnoozing = getIsSnoozing()

  // get the number of users currently active
  const { data: activeUsersCount = 10 } = useGetActiveUsersCountQuery()

  const { show, hide } = useCustomerlyChat({
    position: { desktop: { side: 8, bottom: 52 }, mobile: { side: 8, bottom: 52 } },
    delay: 2000,
    disabled: !isTrialing || isSnoozing,
  })

  //   check if there is a sub
  if (!connect?.instanceId) return null

  if (!isTrialing || !left) return null

  const handleHideBanner = () => {
    const snoozeTimeHours = 1

    const now = new Date().getTime()
    const snoozeUntil = now + snoozeTimeHours * 60 * 60 * 1000

    setSnooze(snoozeUntil)
    // hide customerly
    hide()
  }

  const handleShowBanner = () => {
    // show banner
    setSnooze(null)
    // show customerly
    show()
  }

  // toast.warn('Your free trial is ending soon. Subscribe to keep your data.', { autoClose: false })

  if (isSnoozing)
    return (
      <Styled.TrialBubble onClick={handleShowBanner}>
        <Icon icon="info" />
        Free trial
      </Styled.TrialBubble>
    )

  return (
    <Styled.TrialBanner className={clsx({ urgent: oneDay, critical: oneHour })}>
      <span>{formatted} left of free trial</span>
      {canManage && (
        <>
          <span>-</span>
          <a href={getSubscribeLink(activeUsersCount)} target="_blank" rel="noreferrer">
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
