import { useMemo } from 'react'
import {
  getEnumOptionsArgs,
  getEnumOptionsKey,
  useGetEnumOptionsBatchQuery,
  useListEnumsQuery,
} from '@shared/api'
import type { EnumOptionsArgs } from '@shared/api'
import { getEnumErrorText, hasEnumResolver, normalizeEnumItems } from '@shared/util/attributeEnum'
import type { EnumAttributeLike, ResolvedEnumAttribute } from './useAttributeEnumOptions'

// Which attributes need their options now: a column that scrolled into view, the selected slice, all of them
export type AttributeEnumsRequest = string[] | 'all'

export interface UseAttributeEnumsParams {
  projectName?: string
  request?: AttributeEnumsRequest
}

export const useAttributeEnums = <T extends EnumAttributeLike>(
  attributes: T[],
  { projectName, request = 'all' }: UseAttributeEnumsParams = {},
): ResolvedEnumAttribute<T>[] => {
  // callers rebuild the request list every render, so memoize on its content
  const requestKey = request === 'all' ? 'all' : [...request].sort().join('\u0000')

  // the registry decides which context params a resolver gets, so it also decides the cache keys
  const { data: resolvers, isError: isRegistryError } = useListEnumsQuery()
  const isRegistryLoaded = !!resolvers || isRegistryError

  const { requests, keyByName } = useMemo(() => {
    const requested = request === 'all' ? null : new Set(request)
    const unique = new Map<string, EnumOptionsArgs>()
    const keyByName = new Map<string, string>()

    attributes.forEach((attribute) => {
      if (!hasEnumResolver(attribute.data)) return
      if (requested && !requested.has(attribute.name)) return

      const acceptedParams = resolvers?.find(
        ({ name }) => name === attribute.data?.enumResolver,
      )?.acceptedParams
      const args = getEnumOptionsArgs(attribute.data, { projectName }, acceptedParams)
      const key = getEnumOptionsKey(args)
      keyByName.set(attribute.name, key)
      if (!unique.has(key)) unique.set(key, args)
    })

    // canonical order: [a,b] and [b,a] must hit the same cache entry
    const requests = [...unique]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, args]) => args)
    return { requests, keyByName }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attributes, requestKey, projectName, resolvers])

  // `data`, not `currentData`: keys carry their params, so a previous batch's entries stay valid
  // while a grown request list is still loading
  const { data, isError } = useGetEnumOptionsBatchQuery(
    { requests },
    { skip: !requests.length || !isRegistryLoaded },
  )

  return useMemo(() => {
    if (!keyByName.size) return attributes as ResolvedEnumAttribute<T>[]

    return attributes.map((attribute): ResolvedEnumAttribute<T> => {
      const key = keyByName.get(attribute.name)
      if (!key) return attribute

      const state = data?.[key]
      if (!state) {
        // the whole batch failed (thrown request), so nothing per attribute is known
        if (isError) return { ...attribute, enumIsLoading: false, enumError: getEnumErrorText() }
        return { ...attribute, enumIsLoading: true }
      }

      return {
        ...attribute,
        enumIsLoading: false,
        enumError: state.error ? getEnumErrorText(state.error) : undefined,
        data: { ...attribute.data, enum: normalizeEnumItems(state.items) },
      }
    })
  }, [attributes, keyByName, data, isError])
}
