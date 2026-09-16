import { isThisYear, isToday, isValid, isYesterday } from 'date-fns'
import styled from 'styled-components'
import Typography from '@/theme/typography.module.css'
import clsx from 'clsx'

const dayFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long' })
const dayWithYearFormat = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

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

  return isThisYear(dateObj) ? dayFormat.format(dateObj) : dayWithYearFormat.format(dateObj)
}

const Divider = styled.li`
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);
  padding: var(--padding-m) var(--padding-s) var(--base-gap-small);

  color: var(--md-sys-color-outline);
  user-select: none;

  &::after {
    content: '';
    flex: 1;
    border-top: 1px solid var(--md-sys-color-outline-variant);
  }
`

interface InboxDateDividerProps {
  date: string
}

const InboxDateDivider = ({ date }: InboxDateDividerProps) => (
  <Divider className={clsx('inbox-date-divider', Typography.titleSmall)}>
    {getDayLabel(date)}
  </Divider>
)

export default InboxDateDivider
