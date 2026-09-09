import { useEffect, useState } from 'react'
import axios from 'axios'
import type { FormOptionItem, SimpleFormField } from '@shared/api'
import { extractTemplateVars, resolveTemplates } from './ruleEngine'

type FormValues = Record<string, unknown>

export type ResolvedOptionsState = Record<string, { options: FormOptionItem[]; loading: boolean }>

const isUnset = (value: unknown): boolean => value === null || value === undefined || value === ''

/**
 * Fetches live options from GET /api/enum/{enumResolver} for every field that
 * declares one, re-fetching whenever its (template-resolved) params change.
 *
 * A field whose enumResolverParams reference an earlier field that isn't set
 * yet is left with no options rather than firing a request the resolver
 * would reject outright (e.g. ayon_server's "attrib" resolver 400s without a
 * `name` param) - pair this with a `rules` entry that keeps the field
 * read-only/cleared until its dependency is set.
 *
 * Plain axios for now rather than an RTK Query endpoint - the resolver name
 * and its accepted params are dynamic (per addon, per field), so there's no
 * fixed endpoint shape to codegen against yet.
 */
export const useResolvedOptions = (
  fields: SimpleFormField[],
  values: FormValues,
): ResolvedOptionsState => {
  const [state, setState] = useState<ResolvedOptionsState>({})

  const resolverFields = fields.filter((field) => !!field.enumResolver)

  // Field identity + resolved params, used both to fetch and as an effect
  // dependency (JSON.stringify gives a cheap deep-equality key without
  // pulling in a deep-compare dependency).
  const paramsKey = JSON.stringify(
    resolverFields.map((field) => [
      field.name,
      field.enumResolver,
      resolveTemplates(field.enumResolverParams || {}, values),
    ]),
  )

  useEffect(() => {
    if (!resolverFields.length) return
    let cancelled = false

    resolverFields.forEach((field) => {
      const rawParams = field.enumResolverParams || {}
      const templateVars = extractTemplateVars(rawParams)
      const missingDependency = templateVars.some((name) => isUnset(values[name]))

      if (missingDependency) {
        setState((prev) => ({ ...prev, [field.name]: { options: [], loading: false } }))
        return
      }

      const params = resolveTemplates(rawParams, values) as Record<string, unknown>

      setState((prev) => ({
        ...prev,
        [field.name]: { options: prev[field.name]?.options ?? [], loading: true },
      }))

      axios
        .get<FormOptionItem[]>(`/api/enum/${field.enumResolver}`, { params })
        .then((response) => {
          if (cancelled) return
          setState((prev) => ({
            ...prev,
            [field.name]: { options: response.data || [], loading: false },
          }))
        })
        .catch(() => {
          if (cancelled) return
          setState((prev) => ({ ...prev, [field.name]: { options: [], loading: false } }))
        })
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey])

  return state
}
