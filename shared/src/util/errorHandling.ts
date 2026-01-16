import { toast } from 'react-toastify'

/**
 * Formats and displays an error message
 * @param error - The error object or string
 * @param prefix - A prefix to prepend to the error message
 * @returns The formatted error message
 */
export const getErrorMessage = (error: unknown, prefix: string): string => {
  const errorString = error instanceof Error ? error.message : String(error)
  const errorMessage = `${prefix}: ${errorString}`
  console.error(errorMessage)
  toast.error(errorMessage)
  return errorMessage
}