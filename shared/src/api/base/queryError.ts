import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

export type StandardErrorData = {
  code: number
  detail: string
  [key: string]: unknown
}

const isRecord = (value: unknown): value is Record<string, any> =>
  typeof value === 'object' && value !== null

const getResponseStatus = (error: Record<string, any>): number | undefined => {
  if (typeof error.status === 'number') return error.status
  if (typeof error.originalStatus === 'number') return error.originalStatus
  if (typeof error.response?.status === 'number') return error.response.status
  return undefined
}

const getErrorDetail = (error: unknown): string => {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (!isRecord(error)) return String(error)
  if (typeof error.data?.detail === 'string') return error.data.detail
  if (typeof error.data === 'string') return error.data
  if (Array.isArray(error.data?.errors)) {
    const details = error.data.errors
      .map((item: any) => item?.message)
      .filter((message: unknown): message is string => typeof message === 'string')
    if (details.length) return details.join('; ')
  }
  if (typeof error.response?.data?.detail === 'string') return error.response.data.detail
  if (typeof error.response?.data === 'string') return error.response.data
  if (Array.isArray(error.response?.errors)) {
    const details = error.response.errors
      .map((item: any) => item?.message)
      .filter((message: unknown): message is string => typeof message === 'string')
    if (details.length) return details.join('; ')
  }
  if (typeof error.error === 'string') return error.error
  if (typeof error.message === 'string') return error.message
  return 'Unknown error'
}

export const normalizeQueryError = (error: unknown, fallbackStatus = 500): FetchBaseQueryError => {
  const candidate =
    isRecord(error) && isRecord(error.error) && getResponseStatus(error) === undefined
      ? error.error
      : error

  if (isRecord(candidate)) {
    const status = getResponseStatus(candidate) ?? fallbackStatus
    const data = candidate.data ?? candidate.response?.data

    if (isRecord(data)) {
      const detail = getErrorDetail(candidate)
      return {
        status,
        data: {
          ...data,
          code: typeof data.code === 'number' ? data.code : status,
          detail: typeof data.detail === 'string' ? data.detail : detail,
        },
      }
    }

    return {
      status,
      data: {
        code: status,
        detail: getErrorDetail(candidate),
      },
    }
  }

  return {
    status: fallbackStatus,
    data: {
      code: fallbackStatus,
      detail: getErrorDetail(error),
    },
  }
}
