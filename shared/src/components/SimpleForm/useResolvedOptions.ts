import { useEffect, useState } from 'react'
import { useLazyGetEnumOptionsQuery } from '@shared/api'
import type { EnumResolverParams, FormOptionItem, SimpleFormField } from '@shared/api'
import { extractTemplateVars, resolveTemplates } from './ruleEngine'

type FormValues = Record<string, unknown>

export type ResolvedOptionsState = Record<string, { options: FormOptionItem[]; loading: boolean }>

const isUnset = (value: unknown): boolean => value === null || value === undefined || value === ''

/**
 * Fetches live options through the enum resolver registry for every field that
 * declares one, re-fetching whenever its (template-resolved) params change.
 *
 * A field whose enumResolverParams reference an earlier field that isn't set
 * yet is left with no options rather than firing a request the resolver
 * would reject outright (e.g. ayon_server's "attrib" resolver 400s without a
 * `name` param) - pair this with a `rules` entry that keeps the field
 * read-only/cleared until its dependency is set.
 */
export const useResolvedOptions = (
  fields: SimpleFormField[],
  values: FormValues,
): ResolvedOptionsState => {
  const [state, setState] = useState<ResolvedOptionsState>({})
  const [fetchEnumOptions] = useLazyGetEnumOptionsQuery()

  const resolverFields = fields.filter((field) => !!field.enum_resolver)

  // Field identity + resolved params, used both to fetch and as an effect
  // dependency (JSON.stringify gives a cheap deep-equality key without
  // pulling in a deep-compare dependency).
  const paramsKey = JSON.stringify(
    resolverFields.map((field) => [
      field.name,
      field.enum_resolver,
      resolveTemplates(field.enum_resolver_params || {}, values),
    ]),
  )

  useEffect(() => {
    if (!resolverFields.length) return
    let cancelled = false

    resolverFields.forEach(async (field) => {
      const rawParams = field.enum_resolver_params || {}
      const templateVars = extractTemplateVars(rawParams)
      const missingDependency = templateVars.some((name) => isUnset(values[name]))

      if (missingDependency) {
        setState((prev) => ({ ...prev, [field.name]: { options: [], loading: false } }))
        return
      }

      const params = resolveTemplates(rawParams, values) as EnumResolverParams

      setState((prev) => ({
        ...prev,
        [field.name]: { options: prev[field.name]?.options ?? [], loading: true },
      }))

      let options: FormOptionItem[] = []
      try {
        const result = await fetchEnumOptions(
          { enumName: field.enum_resolver as string, params },
          true,
        ).unwrap()
        if (!result.error) options = result.items
      } catch {
        options = []
      }

      if (cancelled) return
      setState((prev) => ({ ...prev, [field.name]: { options, loading: false } }))
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey])

  return state
}
