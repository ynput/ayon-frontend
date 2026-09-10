import { useEffect, useMemo, useState } from 'react'
import type { FormOptionItem, SimpleFormField } from '@shared/api'
import type { SimpleFormValue, SimpleFormValueDict } from './types'
import { getDefaults } from './defaults'
import { computeFieldPatches, type FieldPatchMap } from './ruleEngine'
import { useResolvedOptions, type ResolvedOptionsState } from './useResolvedOptions'

export interface FormStateApi {
  formData: SimpleFormValueDict | null
  patches: FieldPatchMap
  resolvedOptions: ResolvedOptionsState
  setFieldValue: (name: string, value: SimpleFormValue) => void
}

/**
 * Owns every "moving part" of a SimpleForm: the field values themselves,
 * which rules currently match (and the FormFieldPatch that follows from
 * that), live enumResolver options, and the two derived-state clamps that
 * keep formData consistent with both of those:
 *  - a rule forcing a value (e.g. clearing a field while it's read-only)
 *  - a select/multiselect whose options changed out from under its value
 */
export const useFormState = (
  fields: SimpleFormField[],
  values?: SimpleFormValueDict,
): FormStateApi => {
  const [formData, setFormData] = useState<SimpleFormValueDict | null>(null)

  useEffect(() => {
    setFormData(getDefaults(fields, values || {}))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, values])

  // `rules` matched against the current values - a map of fieldName -> the
  // merged FormFieldPatch to apply on top of that field's static definition
  const patches = useMemo(() => computeFieldPatches(fields, formData || {}), [fields, formData])

  // live options for every field with an `enumResolver`, re-fetched whenever
  // its (template-resolved) params change
  const resolvedOptions = useResolvedOptions(fields, formData || {})

  // A rule can force a field's value (e.g. clear it while it's read-only) -
  // apply that back into formData so a stale value isn't silently submitted.
  useEffect(() => {
    if (!formData) return
    const updates: SimpleFormValueDict = {}
    let changed = false
    for (const [name, patch] of Object.entries(patches)) {
      if ('value' in patch && formData[name] !== patch.value) {
        updates[name] = patch.value as SimpleFormValue
        changed = true
      }
    }
    if (changed) {
      setFormData((prev) => (prev ? { ...prev, ...updates } : prev))
    }
  }, [patches, formData])

  // A select/multiselect's options can change (a rule swaps them, or an
  // enumResolver re-fetches after a dependency changed) - if the current
  // value is no longer one of them, it must be cleared, or the field would
  // keep pointing at a now-invalid option.
  useEffect(() => {
    if (!formData) return
    const updates: SimpleFormValueDict = {}
    let changed = false

    for (const field of fields) {
      if (field.type !== 'select' && field.type !== 'multiselect') continue

      const patch = patches[field.name]
      let options: FormOptionItem[]
      if (patch?.options) {
        options = patch.options
      } else if (field.enumResolver) {
        const resolved = resolvedOptions[field.name]
        // still loading (or hasn't started yet) - the empty list right now
        // doesn't mean the value is actually invalid, so don't touch it
        if (!resolved || resolved.loading) continue
        options = resolved.options
      } else {
        options = field.options ?? []
      }

      const validValues = new Set(options.map((option) => `${option.value}`))
      const current = formData[field.name]

      if (field.type === 'multiselect') {
        const currentArray = Array.isArray(current) ? current : []
        const filtered = currentArray.filter((v) => validValues.has(`${v}`))
        if (filtered.length !== currentArray.length) {
          // still a homogeneous string[] or number[], just fewer of them -
          // TS just can't tell that through the union-array .filter() call
          updates[field.name] = filtered as SimpleFormValue
          changed = true
        }
      } else if (
        current !== undefined &&
        current !== null &&
        current !== '' &&
        !validValues.has(`${current}`)
      ) {
        updates[field.name] = undefined
        changed = true
      }
    }

    if (changed) {
      setFormData((prev) => (prev ? { ...prev, ...updates } : prev))
    }
  }, [fields, patches, resolvedOptions, formData])

  const setFieldValue = (name: string, value: SimpleFormValue) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return { formData, patches, resolvedOptions, setFieldValue }
}
