import { FC } from 'react'
import * as Styled from './TrialBanner.styled'
import clsx from 'clsx'
import getTrialDates from './helpers/getTrialDates'
import getSubscribeLink from './helpers/getSubscribeLink'
import { useGetYnputCloudInfoQuery } from '@queries/cloud/cloud'
import { useAppSelector } from '@state/store'
import { Button, Icon } from '@ynput/ayon-react-components'
import { useGetActiveUsersCountQuery } from '@shared/api'
import { useLocalStorage } from '@shared/hooks'
import { createPortal } from 'react-dom'
import { useCustomerly } from 'react-live-chat-customerly'

interface TrialBannerProps {}

const TrialBanner: FC<TrialBannerProps> = ({}) => {
  const user = useAppSelector((state) => state.user)
  const canManage = user.data.isAdmin || user.data.isManager

  const [snooze, setSnooze] = useLocalStorage<number | null>('trialBannerSnooze', null)

  const { data: connect } = useGetYnputCloudInfoQuery(undefined, { skip: !user.name })
  const { isTrialing, left } = getTrialDates(connect?.subscriptions)
  const { formatted, oneDay, oneHour } = left || {}

  const getIsSnoozing = () => {
    // snooze is in the future and not oneDay or oneHour left
    return snooze && snooze > new Date().getTime() && !oneDay && !oneHour
  }

  const isSnoozing = getIsSnoozing()

  // get the number of users currently active
  const { data: activeUsersCount = 10 } = useGetActiveUsersCountQuery(
    {},
    { skip: !isTrialing || !canManage },
  )

  const { show, hide } = useCustomerly()

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

  if (isSnoozing) {
    // check there is a component with 'header-menu-right' id
    const headerMenuRight = document.getElementById('header-menu-right')
    if (!headerMenuRight) return null

    return createPortal(
      <Styled.TrialBubble onClick={handleShowBanner}>
        <Icon icon="schedule" />
        Free trial - {formatted}
      </Styled.TrialBubble>,
      headerMenuRight,
    )
  }

  return (
    <Styled.TrialBanner className={clsx({ urgent: oneDay, critical: oneHour })}>
      <span>{formatted} left of free trial</span>
      {canManage && (
        <>
          <span>-</span>
          <a
            href={getSubscribeLink(activeUsersCount, connect.orgName)}
            target="_blank"
            rel="noreferrer"
          >
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
