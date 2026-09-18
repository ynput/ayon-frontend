import {
  FC,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import { enumOptionsQueries, useGetEnumOptionsQuery } from '@shared/api'
import { getEnumErrorText, getEnumItemIcon } from '@shared/util/attributeEnum'
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

export const getEnumOptionsArgs = (data: AttributeData | undefined, projectName?: string) => ({
  enumName: data?.enumResolver as string,
  // project_name last: it is the live page scope and must win over saved settings
  params: {
    ...((data?.enumResolverSettings as Record<string, any>) || {}),
    project_name: projectName,
  },
})

const normalizeEnumItems = (items: EnumItem[]) =>
  // resolvers may return an IconModel, widgets expect a plain icon string
  items.map((item) => ({ ...item, icon: getEnumItemIcon(item.icon) }))

// Imperative variant for lazy consumers; shares the query cache with the hook
export const fetchAttributeEnumOptions = async (
  dispatch: ThunkDispatch<any, any, UnknownAction>,
  data: AttributeData,
  projectName?: string,
): Promise<EnumItem[]> => {
  const request = dispatch(
    enumOptionsQueries.endpoints.getEnumOptions.initiate(getEnumOptionsArgs(data, projectName)),
  )
  try {
    const result = await request.unwrap()
    if (result.error) throw new Error(result.error)
    return normalizeEnumItems(result.items)
  } catch (error) {
    throw toEnumRequestError(error)
  } finally {
    request.unsubscribe()
  }
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
    () => getEnumOptionsArgs(data, projectName),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resolver, data?.enumResolverSettings, projectName],
  )

  // currentData, not data: after an args change (e.g. project switch) the previous result is not reused
  const {
    currentData: resolved,
    isFetching,
    isError: isRequestError,
  } = useGetEnumOptionsQuery(args, { skip: !resolver || !!skip })

  // Identity must stay stable across renders: subscribers report options upwards.
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

type OnResolved = (name: string, state: AttributeEnumState) => void

interface SubscriptionProps {
  attribute: EnumAttributeLike
  projectName?: string
  onResolved: OnResolved
}

const AttributeEnumSubscription: FC<SubscriptionProps> = ({
  attribute,
  projectName,
  onResolved,
}) => {
  const state = useAttributeEnumOptions(attribute.data, { projectName })
  const attributeKey = getAttributeEnumCacheKey(attribute, projectName)

  useEffect(() => {
    onResolved(attributeKey, state)
  }, [attributeKey, state.options, state.isLoading, state.isError, state.errorMessage, onResolved])

  return null
}

const sortResolverSettings = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortResolverSettings)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, sortResolverSettings(nestedValue)]),
    )
  }
  return value
}

const getAttributeEnumRequestKey = (name: string, projectName?: string) =>
  JSON.stringify({
    projectName: projectName ?? '',
    name,
  })

const getAttributeEnumCacheKey = (attribute: EnumAttributeLike, projectName?: string) =>
  JSON.stringify({
    projectName: projectName ?? '',
    name: attribute.name,
    enumResolver: attribute.data?.enumResolver ?? '',
    enumResolverSettings: sortResolverSettings(attribute.data?.enumResolverSettings ?? {}),
  })

export interface AttributeEnumResolverProps {
  attributes: EnumAttributeLike[]
  projectName?: string
  onResolved: OnResolved
}

// One subscription per dynamic attribute, feeding non component consumers
export const AttributeEnumResolver: FC<AttributeEnumResolverProps> = ({
  attributes,
  projectName,
  onResolved,
}) => (
  <>
    {attributes
      .filter((attribute) => !!attribute.data?.enumResolver)
      .map((attribute) => (
        <AttributeEnumSubscription
          key={getAttributeEnumCacheKey(attribute, projectName)}
          attribute={attribute}
          projectName={projectName}
          onResolved={onResolved}
        />
      ))}
  </>
)

export type ResolvedEnumAttribute<T> = T & {
  enumIsLoading?: boolean
  enumError?: string
}

type RequestAttributeEnums = (names: string[]) => void

const AttributeEnumRequestContext = createContext<RequestAttributeEnums>(() => {})

// Lazy resolvers only fetch an attribute's options once something asks for them
export const useRequestAttributeEnums = () => useContext(AttributeEnumRequestContext)

// Nested providers (project attributes, list attributes) all receive every request
export const AttributeEnumRequestProvider: FC<{
  onRequest: RequestAttributeEnums
  children: ReactNode
}> = ({ onRequest, children }) => {
  const parentRequest = useContext(AttributeEnumRequestContext)
  const request = useCallback<RequestAttributeEnums>(
    (names) => {
      onRequest(names)
      parentRequest(names)
    },
    [onRequest, parentRequest],
  )
  return (
    <AttributeEnumRequestContext.Provider value={request}>
      {children}
    </AttributeEnumRequestContext.Provider>
  )
}

export interface ResolvedAttributeEnumsOptions {
  lazy?: boolean
}

// Single place that merges resolved options back into an attribute list.
export const useResolvedAttributeEnums = <T extends EnumAttributeLike>(
  attributes: T[],
  projectName?: string,
  { lazy = false }: ResolvedAttributeEnumsOptions = {},
) => {
  const [states, setStates] = useState<Record<string, AttributeEnumState>>({})
  const [requested, setRequested] = useState<ReadonlySet<string>>(() => new Set())

  const requestAttributeEnums = useCallback<RequestAttributeEnums>((names) => {
    const keys = names.map((name) => getAttributeEnumRequestKey(name, projectName))
    setRequested((current) =>
      keys.every((key) => current.has(key)) ? current : new Set([...current, ...keys]),
    )
  }, [projectName])

  const handleResolved = useCallback<OnResolved>((name, state) => {
    setStates((current) => {
      const previous = current[name]
      if (
        previous &&
        previous.options === state.options &&
        previous.isLoading === state.isLoading &&
        previous.isError === state.isError &&
        previous.errorMessage === state.errorMessage
      ) {
        return current
      }
      return { ...current, [name]: state }
    })
  }, [])

  const resolvedAttributes = useMemo(
    () =>
      attributes.map((attribute): ResolvedEnumAttribute<T> => {
        if (!attribute.data?.enumResolver) return attribute
        const state = states[getAttributeEnumCacheKey(attribute, projectName)]
        const isSubscribed =
          !lazy || requested.has(getAttributeEnumRequestKey(attribute.name, projectName))
        return {
          ...attribute,
          enumIsLoading: state ? state.isLoading : isSubscribed,
          enumError: state?.isError ? getEnumErrorText(state.errorMessage) : undefined,
          data: { ...attribute.data, enum: state?.options || EMPTY_OPTIONS },
        }
      }),
    [attributes, lazy, projectName, requested, states],
  )

  const subscribedAttributes = useMemo(
    () =>
      lazy
        ? attributes.filter((attribute) =>
            requested.has(getAttributeEnumRequestKey(attribute.name, projectName)),
          )
        : attributes,
    [attributes, lazy, projectName, requested],
  )

  const enumSubscriptions = (
    <AttributeEnumResolver
      attributes={subscribedAttributes}
      projectName={projectName}
      onResolved={handleResolved}
    />
  )

  return { attributes: resolvedAttributes, enumSubscriptions, requestAttributeEnums }
}
