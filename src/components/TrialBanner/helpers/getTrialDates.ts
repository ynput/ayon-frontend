import { YnputConnectSubscriptionModel } from '@api/rest/cloud'
import { differenceInDays, differenceInHours, formatDistanceToNow, isBefore } from 'date-fns'

const getTrialDates = (
  subscriptions?: YnputConnectSubscriptionModel[],
): {
  isTrialing: boolean
  left?: {
    formatted: string
    oneDay: boolean
    oneHour: boolean
    finished: boolean
  }
} => {
  // get subscription data
  const subscription = subscriptions?.find((s) => s.productType === 'ayon')

  if (!subscription?.trialEnd) return { isTrialing: false, left: undefined }

  const trialEnd = new Date(subscription.trialEnd)
  let timeLeft = formatDistanceToNow(trialEnd, { addSuffix: false })
  // remove "about" from the string
  if (timeLeft.startsWith('about ')) {
    timeLeft = timeLeft.replace('about ', '')
  }
  const lessThanOneDay = differenceInDays(trialEnd, new Date()) < 1
  const lessThanOneHour = differenceInHours(trialEnd, new Date()) < 1
  const finished = isBefore(trialEnd, new Date())

  return {
    isTrialing: true,
    left: {
      formatted: timeLeft,
      oneDay: lessThanOneDay,
      oneHour: lessThanOneHour,
      finished,
    },
  }
}

export default getTrialDates
