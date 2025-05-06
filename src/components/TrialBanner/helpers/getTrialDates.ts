import { YnputConnectSubscriptionModel } from '@shared/api'
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
  const ayonSubs = subscriptions?.filter((s) => s.productType === 'ayon')

  // get any trial subscription
  const trial = ayonSubs?.find((s) => !!s.trialEnd)
  // get non trial subscription
  const noTrial = ayonSubs?.find((s) => !s.trialEnd)

  // if there is no trial subscription, return false
  // if there is a subscription (non trial), return false
  if (!trial || noTrial) return { isTrialing: false, left: undefined }

  if (!trial?.trialEnd) return { isTrialing: false, left: undefined }

  const trialEnd = new Date(trial.trialEnd)
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
