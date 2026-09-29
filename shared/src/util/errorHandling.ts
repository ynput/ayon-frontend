import { toast } from 'react-toastify'

/**
 * Formats and displays an error message
 * @param error - The error object or string
 * @param prefix - A prefix to prepend to the error message
 * @returns The formatted error message
 */
export const getErrorMessage = (error: unknown, prefix: string): string => {
  const errorString = getRequestErrorString(error)
  const errorMessage = `${prefix}: ${errorString}`
  toast.error(errorMessage)
  return errorMessage
}

export const getRequestErrorString = (error: unknown): string => {
  if (!error) return ''
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (typeof error !== 'object') return String(error)

  const queryError = error as {
    data?: { detail?: unknown }
    error?: unknown
    message?: unknown
  }

  if (typeof queryError.data?.detail === 'string') return queryError.data.detail
  if (typeof queryError.error === 'string') return queryError.error
  if (queryError.error && typeof queryError.error === 'object') {
    return getRequestErrorString(queryError.error)
  }
  if (typeof queryError.message === 'string') return queryError.message
  try {
    return JSON.stringify(error) || ''
  } catch {
    return ''
  }
}
