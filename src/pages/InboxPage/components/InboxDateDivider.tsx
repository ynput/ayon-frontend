import { format, isThisYear, isToday, isValid, isYesterday } from 'date-fns'
import clsx from 'clsx'
import * as Styled from './InboxDateDivider.styled'
import Typography from '@/theme/typography.module.css'

export const getDayKey = (date?: string): string | null => {
  if (!date) return null
  const dateObj = new Date(date)
  if (!isValid(dateObj)) return null

  return dateObj.toDateString()
}

const getDayLabel = (date: string): string => {
  const dateObj = new Date(date)
  if (isToday(dateObj)) return 'Today'
  if (isYesterday(dateObj)) return 'Yesterday'

  return format(dateObj, isThisYear(dateObj) ? 'd MMMM' : 'd MMMM yyyy')
}

interface InboxDateDividerProps {
  date: string
}

const InboxDateDivider = ({ date }: InboxDateDividerProps) => (
  <Styled.Divider className={clsx('inbox-date-divider', Typography.titleSmall)}>
    {getDayLabel(date)}
  </Styled.Divider>
)

export default InboxDateDivider
