import useCustomerlyChat from '@hooks/useCustomerly'
import useLocalStorage from '@hooks/useLocalStorage'
import { useGetYnputCloudInfoQuery } from '@queries/cloud/cloud'
import { FC } from 'react'
import getTrialDates from './TrialBanner/helpers/getTrialDates'
import { useListAddonsQuery } from '@queries/addons/getAddons'
import { AddonListItem } from '@api/rest/addons'

interface CustomerlyProps {}

const Customerly: FC<CustomerlyProps> = ({}) => {
  const [snooze, _setSnooze] = useLocalStorage<number | null>('trialBannerSnooze', null)

  //   get if the server is playground
  const { data: { addons = [] } = {} } = useListAddonsQuery({ details: false })
  const getIsPlayground = (addons: AddonListItem[]): boolean => {
    return addons.some((addon) => addon.name === 'playground' && addon.productionVersion)
  }

  const { data: connect } = useGetYnputCloudInfoQuery()
  const { isTrialing, left } = getTrialDates(connect?.subscriptions)
  const { oneDay, oneHour } = left || {}

  const getIsSnoozing = () => {
    // snooze is in the future and not oneDay or oneHour left
    return snooze && snooze > new Date().getTime() && !oneDay && !oneHour
  }

  const isSnoozing = getIsSnoozing()
  const isPlayground = getIsPlayground(addons)

  //   invoke customerly chat
  useCustomerlyChat({
    position: { desktop: { side: 8, bottom: 52 }, mobile: { side: 8, bottom: 52 } },
    delay: 2000,
    enabled: (isTrialing || isPlayground) && !isSnoozing,
    context: isPlayground ? 'playground' : 'trial',
  })

  return null
}

export default Customerly
