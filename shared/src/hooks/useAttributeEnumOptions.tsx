import { useCallback, useMemo } from 'react'
import { getEnumOptionsArgs, useGetEnumOptionsQuery, useLazyGetEnumOptionsQuery } from '@shared/api'
import { normalizeEnumItems } from '@shared/util/attributeEnum'
import type { AttributeData, EnumItem } from '@shared/api'

const EMPTY_OPTIONS: EnumItem[] = []

export interface UseAttributeEnumOptionsParams {
  projectName?: string
  skip?: boolean
}

export interface AttributeEnumState {
  options: EnumItem[]
  isLoading: boolean
  isError: boolean
  errorMessage?: string
}

export type FetchAttributeEnumOptions = (
  data: AttributeData,
  projectName?: string,
) => Promise<EnumItem[]>

// Imperative variant for lazy consumers (e.g. a filter dropdown); shares the query cache with the hook
export const useFetchAttributeEnumOptions = (): FetchAttributeEnumOptions => {
  const [fetchEnumOptions] = useLazyGetEnumOptionsQuery()

  return useCallback(
    async (data, projectName) => {
      try {
        const result = await fetchEnumOptions(getEnumOptionsArgs(data, { projectName }), true).unwrap()
        if (result.error) throw new Error(result.error)
        return normalizeEnumItems(result.items)
      } catch (error) {
        throw toEnumRequestError(error)
      }
    },
    [fetchEnumOptions],
  )
}

// unwrap() rejects with plain RTK objects ({ status, data }, { status, error } or { message }), not Error instances
const toEnumRequestError = (error: unknown): Error => {
  if (error instanceof Error) return error
  const {
    message,
    data,
    status,
    error: reason,
  } = (error || {}) as {
    message?: unknown
    data?: { detail?: unknown }
    status?: unknown
    error?: unknown // FETCH_ERROR / PARSING_ERROR / TIMEOUT_ERROR reason
  }
  if (typeof data?.detail === 'string') return new Error(data.detail)
  if (typeof reason === 'string') return new Error(reason)
  if (typeof message === 'string') return new Error(message)
  return new Error(status ? `Request failed (${status})` : 'Request failed')
}

// Options for one attribute: static data.enum, or resolved through the backend enum registry.
export const useAttributeEnumOptions = (
  data: AttributeData | undefined,
  { projectName, skip }: UseAttributeEnumOptionsParams = {},
): AttributeEnumState => {
  const resolver = data?.enumResolver

  const args = useMemo(
    () => getEnumOptionsArgs(data, { projectName }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resolver, data?.enumResolverSettings, projectName],
  )

  // currentData, not data: after an args change (e.g. project switch) the previous result is not reused
  const {
    currentData: resolved,
    isFetching,
    isError: isRequestError,
  } = useGetEnumOptionsQuery(args, { skip: !resolver || !!skip })

  const options = useMemo(() => {
    if (!resolver) return data?.enum || EMPTY_OPTIONS
    if (!resolved) return EMPTY_OPTIONS
    return normalizeEnumItems(resolved.items)
  }, [resolver, resolved, data?.enum])

  const isError = !!resolver && !isFetching && (isRequestError || !!resolved?.error)

  return {
    options,
    // a background refetch (tag invalidation) keeps the cached options, so it is not a load
    isLoading: !!resolver && isFetching && !resolved,
    isError,
    errorMessage: isError ? resolved?.error : undefined,
  }
}

export interface EnumAttributeLike {
  name: string
  data?: AttributeData
}

export type ResolvedEnumAttribute<T> = T & {
  enumIsLoading?: boolean
  enumError?: string
}
