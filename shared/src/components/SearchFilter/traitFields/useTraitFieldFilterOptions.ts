import { useCallback, useMemo } from 'react'
import { toast } from 'react-toastify'
import type { Filter, FilterValue, Option } from '@ynput/ayon-react-components'
import { useGetProjectTraitFieldsQuery, useLazyListTraitFieldValuesQuery } from '@shared/api'
import {
  buildTraitFieldOptions,
  buildTraitIdsOption,
  candidateLabel,
  expressionToFilters,
  flattenTraitFields,
  parseTraitFieldExpression,
  traitFieldValuesToFilterValues,
} from './traitFieldOptions'

const FIELD_VALUES_LIMIT = 100

type UseTraitFieldFilterOptionsParams = {
  projectName?: string
  enableExcludes?: boolean
  enableRelativeValues?: boolean
  skip?: boolean
}

export type TraitFieldFilterOptions = {
  options: Option[]
  // pass to SearchFilter `parseSearchText` to turn `PixelBased:width = 1920` into chips
  parseSearchText: (text: string) => Filter[] | false | null
  isLoading: boolean
}

// Filter options for trait fields of representations in a project, plus the typed syntax parser.
// Servers without the endpoint give no options. Studio settings (`traits_filtering` in the core
// addon project settings) are applied by the server.
export const useTraitFieldFilterOptions = ({
  projectName,
  enableExcludes,
  enableRelativeValues,
  skip,
}: UseTraitFieldFilterOptionsParams): TraitFieldFilterOptions => {
  const { data, isLoading } = useGetProjectTraitFieldsQuery(
    { projectName: projectName || '' },
    { skip: skip || !projectName },
  )
  const [fetchFieldValues] = useLazyListTraitFieldValuesQuery()

  const traits = useMemo(() => data?.traits || [], [data])
  const fields = useMemo(() => flattenTraitFields(traits), [traits])

  const loadFieldValues = useCallback(
    async (trait: string, field: string): Promise<FilterValue[]> => {
      if (!projectName) return []
      try {
        const values = await fetchFieldValues(
          { projectName, trait, field, limit: FIELD_VALUES_LIMIT },
          true,
        ).unwrap()
        return traitFieldValuesToFilterValues(values)
      } catch (error: any) {
        throw new Error(error?.data?.detail || error?.message || 'Unable to load values')
      }
    },
    [projectName, fetchFieldValues],
  )

  const options = useMemo(() => {
    const fieldOptions = buildTraitFieldOptions(fields, {
      enableExcludes,
      enableRelativeValues,
      loadFieldValues,
      loadValuesKey: projectName,
    })
    const traitsOption = buildTraitIdsOption(traits, { enableExcludes })
    return traitsOption ? [...fieldOptions, traitsOption] : fieldOptions
  }, [fields, traits, enableExcludes, enableRelativeValues, loadFieldValues, projectName])

  const parseSearchText = useCallback(
    (text: string): Filter[] | false | null => {
      // only text that looks like an expression is ours, the rest is a normal search
      if (!fields.length || !/!=|=/.test(text)) return null
      const result = parseTraitFieldExpression(text, fields)
      if (result.ok) return expressionToFilters(result.expression)
      // keep the typed text, so it can be fixed
      const candidates = result.candidates?.map(candidateLabel).join(', ')
      toast.error(candidates ? `${result.error}: ${candidates}` : result.error)
      return false
    },
    [fields],
  )

  return { options, parseSearchText, isLoading }
}
