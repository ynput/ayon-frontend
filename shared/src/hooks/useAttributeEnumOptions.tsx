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
import { useGetEnumOptionsQuery, useLazyGetEnumOptionsQuery } from '@shared/api'
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
        const result = await fetchEnumOptions(getEnumOptionsArgs(data, projectName), true).unwrap()
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

export type ResolvedEnumAttribute<T> = T & {
  enumIsLoading?: boolean
  enumError?: string
}

type EnumStates = Record<string, AttributeEnumState>

type OnResolved = (key: string, state: AttributeEnumState) => void

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

// Two attributes pointing at the same resolver and settings share one entry
const getAttributeEnumKey = (attribute: EnumAttributeLike, projectName?: string) =>
  JSON.stringify({
    projectName: projectName ?? '',
    enumResolver: attribute.data?.enumResolver ?? '',
    enumResolverSettings: sortResolverSettings(attribute.data?.enumResolverSettings ?? {}),
  })

// A query is a hook call, so a dynamic list of them needs one component each.
// They render nothing: they exist to run the query and hand its state to the provider.
const AttributeEnumSubscription: FC<{
  attributeKey: string
  data: AttributeData
  projectName?: string
  onResolved: OnResolved
}> = ({ attributeKey, data, projectName, onResolved }) => {
  const state = useAttributeEnumOptions(data, { projectName })

  useEffect(() => {
    onResolved(attributeKey, state)
  }, [attributeKey, state.options, state.isLoading, state.isError, state.errorMessage, onResolved])

  return null
}

interface AttributeEnumsContextValue {
  attributes: ResolvedEnumAttribute<EnumAttributeLike>[]
  request: (names: string[]) => void
}

const AttributeEnumsContext = createContext<AttributeEnumsContextValue | null>(null)

// Lazy providers only fetch an attribute's options once a column, filter or slicer asks for them.
// Nested providers (project attributes, list attributes) all receive every request.
export const useRequestAttributeEnums = () => {
  const context = useContext(AttributeEnumsContext)
  return context?.request ?? noRequest
}

const noRequest = () => {}

// Attributes with their resolver options merged into data.enum, read from the nearest provider
export const useAttributeEnums = <T extends EnumAttributeLike>(): ResolvedEnumAttribute<T>[] => {
  const context = useContext(AttributeEnumsContext)
  return (context?.attributes ?? EMPTY_ATTRIBUTES) as ResolvedEnumAttribute<T>[]
}

const EMPTY_ATTRIBUTES: ResolvedEnumAttribute<EnumAttributeLike>[] = []

export interface AttributeEnumsProviderProps<T extends EnumAttributeLike> {
  attributes: T[]
  projectName?: string
  lazy?: boolean
  children: ReactNode
}

// Single place that resolves dynamic enums and merges the options back into an attribute list
export const AttributeEnumsProvider = <T extends EnumAttributeLike>({
  attributes,
  projectName,
  lazy = false,
  children,
}: AttributeEnumsProviderProps<T>) => {
  const [states, setStates] = useState<EnumStates>({})
  const [requested, setRequested] = useState<ReadonlySet<string>>(() => new Set())
  const parentRequest = useRequestAttributeEnums()

  const request = useCallback(
    (names: string[]) => {
      setRequested((current) =>
        names.every((name) => current.has(name)) ? current : new Set([...current, ...names]),
      )
      parentRequest(names)
    },
    [parentRequest],
  )

  const handleResolved = useCallback<OnResolved>((key, state) => {
    setStates((current) => {
      const previous = current[key]
      if (
        previous &&
        previous.options === state.options &&
        previous.isLoading === state.isLoading &&
        previous.isError === state.isError &&
        previous.errorMessage === state.errorMessage
      ) {
        return current
      }
      return { ...current, [key]: state }
    })
  }, [])

  const enumAttributes = useMemo(
    () =>
      attributes
        .filter((attribute) => !!attribute.data?.enumResolver)
        .map((attribute) => ({
          attribute,
          key: getAttributeEnumKey(attribute, projectName),
          isSubscribed: !lazy || requested.has(attribute.name),
        })),
    [attributes, lazy, projectName, requested],
  )

  const resolvedAttributes = useMemo(() => {
    if (!enumAttributes.length) return attributes as ResolvedEnumAttribute<T>[]
    const byName = new Map(enumAttributes.map((entry) => [entry.attribute.name, entry]))

    return attributes.map((attribute): ResolvedEnumAttribute<T> => {
      const entry = byName.get(attribute.name)
      if (!entry) return attribute
      const state = states[entry.key]
      return {
        ...attribute,
        enumIsLoading: state ? state.isLoading : entry.isSubscribed,
        enumError: state?.isError ? getEnumErrorText(state.errorMessage) : undefined,
        data: { ...attribute.data, enum: state?.options || EMPTY_OPTIONS },
      }
    })
  }, [attributes, enumAttributes, states])

  // attributes sharing a resolver and settings resolve through one subscription
  const subscriptions = useMemo(() => {
    const unique = new Map<string, AttributeData>()
    enumAttributes
      .filter((entry) => entry.isSubscribed)
      .forEach((entry) => {
        if (!unique.has(entry.key)) unique.set(entry.key, entry.attribute.data as AttributeData)
      })
    return [...unique.entries()]
  }, [enumAttributes])

  const value = useMemo(
    () => ({ attributes: resolvedAttributes, request }),
    [resolvedAttributes, request],
  )

  return (
    <AttributeEnumsContext.Provider value={value}>
      {subscriptions.map(([key, data]) => (
        <AttributeEnumSubscription
          key={key}
          attributeKey={key}
          data={data}
          projectName={projectName}
          onResolved={handleResolved}
        />
      ))}
      {children}
    </AttributeEnumsContext.Provider>
  )
}
