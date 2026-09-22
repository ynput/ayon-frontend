import { useMemo } from 'react'
import { buildEnumOptionsRequest, useGetEnumOptionsBatchQuery } from '@shared/api'
import type { EnumOptionsBatchRequest } from '@shared/api'
import {
  getAttributeEnumKey,
  getEnumErrorText,
  hasEnumResolver,
  normalizeEnumItems,
} from '@shared/util/attributeEnum'
import type { EnumAttributeLike, ResolvedEnumAttribute } from './useAttributeEnumOptions'

// Which attributes need their options now: a column that scrolled into view, the selected slice, all of them
export type AttributeEnumsRequest = string[] | 'all'

export interface UseAttributeEnumsParams {
  projectName?: string
  // reaches only the resolvers that accept a `user` param
  userName?: string
  request?: AttributeEnumsRequest
}

export const useAttributeEnums = <T extends EnumAttributeLike>(
  attributes: T[],
  { projectName, userName, request = 'all' }: UseAttributeEnumsParams = {},
): ResolvedEnumAttribute<T>[] => {
  // callers rebuild the request list every render, so memoize on its content
  const requestKey = request === 'all' ? 'all' : [...request].sort().join('\u0000')

  const requests = useMemo(() => {
    const requested = request === 'all' ? null : new Set(request)
    const unique = new Map<string, EnumOptionsBatchRequest>()

    attributes.forEach((attribute) => {
      if (!hasEnumResolver(attribute.data)) return
      if (requested && !requested.has(attribute.name)) return

      const entry = buildEnumOptionsRequest(attribute.data!)
      if (!unique.has(entry.key)) unique.set(entry.key, entry)
    })

    // canonical order: [a,b] and [b,a] must hit the same cache entry
    return [...unique.values()].sort((left, right) => left.key.localeCompare(right.key))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attributes, requestKey])

  // data, not currentData: a growing request list keeps the options already merged in
  const { data: resolved, isError } = useGetEnumOptionsBatchQuery(
    { requests, projectName, userName },
    { skip: !requests.length },
  )

  return useMemo(() => {
    if (!requests.length) return attributes as ResolvedEnumAttribute<T>[]
    const requestedKeys = new Set(requests.map(({ key }) => key))

    return attributes.map((attribute): ResolvedEnumAttribute<T> => {
      if (!hasEnumResolver(attribute.data)) return attribute

      const key = getAttributeEnumKey(attribute.data)
      const state = resolved?.[key]
      if (!state) {
        if (!requestedKeys.has(key)) return attribute
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
  }, [attributes, requests, resolved, isError])
}
