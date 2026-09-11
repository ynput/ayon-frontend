import type { FormFieldPatch, FormOptionItem, SimpleFormField } from '@shared/api'
import type { ResolvedOptionsState } from './useResolvedOptions'

/**
 * The options a select/multiselect field should show right now: a rule's
 * `set.options` wins if present, otherwise a resolver's live results (or `[]`
 * while those haven't loaded yet), otherwise the field's own static list.
 * Returns `undefined` for a field that isn't a select/multiselect at all.
 */
export const getFieldOptions = (
  field: SimpleFormField,
  patch: FormFieldPatch | undefined,
  resolvedOptions: ResolvedOptionsState,
): FormOptionItem[] | undefined => {
  if (field.type !== 'select' && field.type !== 'multiselect') return undefined
  if (patch?.options) return patch.options
  if (field.enumResolver) return resolvedOptions[field.name]?.options ?? []
  return field.options ?? []
}
