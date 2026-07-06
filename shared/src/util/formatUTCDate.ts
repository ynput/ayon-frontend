import { format } from 'date-fns'

export const formatUTCDate = (date: Date, formatStr: string): string => {
  const shifted = new Date(date.getTime() + date.getTimezoneOffset() * 60000)
  return format(shifted, formatStr)
}
