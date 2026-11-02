import { isValid } from 'date-fns'

export const getDayKey = (date?: string): string | null => {
  if (!date) return null
  const dateObj = new Date(date)
  if (!isValid(dateObj)) return null

  return dateObj.toDateString()
}
