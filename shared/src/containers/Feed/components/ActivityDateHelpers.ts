import { formatDistanceToNow, isSameMinute } from 'date-fns'

export const getFuzzyDate = (date: Date) => {
  let fuzzyDate = formatDistanceToNow(date, { addSuffix: true })

  // remove 'about' from the string
  fuzzyDate = fuzzyDate.replace('about', '')
  // replace minutes with min
  fuzzyDate = fuzzyDate.replace('minutes', 'mins')
  fuzzyDate = fuzzyDate.replace('minute', 'min')
  // remove the word ' ago'
  fuzzyDate = fuzzyDate.replace(' ago', '')

  // if date is less than a minute ago, return 'Just now'
  if (isSameMinute(date, new Date())) fuzzyDate = 'Just now'

  return fuzzyDate
}
