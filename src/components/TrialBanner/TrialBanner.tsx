import { FC } from 'react'
import * as Styled from './TrialBanner.styled'
import clsx from 'clsx'
import getTrialDates from './helpers/getTrialDates'
import getSubscribeLink from './helpers/getSubscribeLink'
import { useGetYnputCloudInfoQuery } from '@queries/cloud/cloud'

interface TrialBannerProps {}

const TrialBanner: FC<TrialBannerProps> = ({}) => {
  const { data: connect } = useGetYnputCloudInfoQuery()

  //   check if there is a sub
  if (!connect?.instanceId) return null

  const { isTrialing, left } = getTrialDates(connect?.subscriptions)

  if (!isTrialing || !left) return null

  const { formatted, oneDay, oneHour } = left

  return (
    <Styled.TrialBanner className={clsx({ urgent: oneDay, critical: oneHour })}>
      <span>{formatted} left of free trial</span>
      <span>-</span>
      <a href={getSubscribeLink(connect.instanceId)} target="_blank" rel="noreferrer">
        <u>
          <span>subscribe to keep your data</span>
        </u>
      </a>
    </Styled.TrialBanner>
  )
}

export default TrialBanner
