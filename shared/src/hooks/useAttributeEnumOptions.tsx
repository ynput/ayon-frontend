import { useCallback, useMemo } from 'react'
import {
  getEnumOptionsArgs,
  useGetEnumOptionsQuery,
  useLazyGetEnumOptionsQuery,
  useLazyListEnumsQuery,
  useListEnumsQuery,
} from '@shared/api'
import { normalizeEnumItems } from '@shared/util/attributeEnum'
import type { AttributeData, EnumItem } from '@shared/api'

const EMPTY_OPTIONS: EnumItem[] = []

export interface UseAttributeEnumOptionsParams {
  projectName?: string
  skip?: boolean
}

// A resolver only gets the context params it accepts, same rule (and cache keys) as the batch query
const useAcceptedParams = (resolver?: string) => {
  const { data: resolvers, isError } = useListEnumsQuery(undefined, { skip: !resolver })

  return useMemo(
    () => ({
      // a failed registry is settled too: every param is sent, same fallback as the batch
      isRegistryLoaded: !!resolvers || isError,
      acceptedParams: resolvers?.find(({ name }) => name === resolver)?.acceptedParams,
    }),
    [resolvers, isError, resolver],
  )
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
  const [fetchResolvers] = useLazyListEnumsQuery()

  return useCallback(
    async (data, projectName) => {
      // wait for the registry so the params, and with them the cache key, match the hooks
      const resolvers = await fetchResolvers(undefined, true)
        .unwrap()
        .catch(() => undefined)
      const acceptedParams = resolvers?.find(({ name }) => name === data.enumResolver)?.acceptedParams
      try {
        const result = await fetchEnumOptions(
          getEnumOptionsArgs(data, { projectName }, acceptedParams),
          true,
        ).unwrap()
        if (result.error) throw new Error(result.error)
        return normalizeEnumItems(result.items)
      } catch (error) {
        throw toEnumRequestError(error)
      }
    },
    [fetchEnumOptions, fetchResolvers],
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
  const { acceptedParams, isRegistryLoaded } = useAcceptedParams(resolver)

  const args = useMemo(
    () => getEnumOptionsArgs(data, { projectName }, acceptedParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resolver, data?.enumResolverSettings, projectName, acceptedParams],
  )

  // currentData, not data: after an args change (e.g. project switch) the previous result is not reused
  const {
    currentData: resolved,
    isFetching,
    isError: isRequestError,
  } = useGetEnumOptionsQuery(args, {
    // waiting for the registry keeps the cache key final: no request is sent with params that get dropped
    skip: !resolver || !!skip || !isRegistryLoaded,
  })

  const options = useMemo(() => {
    if (!resolver) return data?.enum || EMPTY_OPTIONS
    if (!resolved) return EMPTY_OPTIONS
    return normalizeEnumItems(resolved.items)
  }, [resolver, resolved, data?.enum])

  const isError = !!resolver && !isFetching && (isRequestError || !!resolved?.error)

  return {
    options,
    // a background refetch (tag invalidation) keeps the cached options, so it is not a load
    isLoading: !!resolver && !skip && (!isRegistryLoaded || (isFetching && !resolved)),
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
