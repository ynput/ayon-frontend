import React, { useEffect } from 'react'
import { FormLayout, FormRow } from '@ynput/ayon-react-components'
import { useFormState } from './useFormState'
import { getFieldOptions } from './getFieldOptions'
import { FormLabel } from './FormLabel'
import { FormField } from './FormField'
import type { SimpleFormField } from '@shared/api'
import type { SimpleFormValueDict } from './types'

export interface SimpleFormProps {
  fields: SimpleFormField[]
  /** Initial/seed values - keyed by field name, same shape as onChange emits */
  values?: SimpleFormValueDict
  /** Called with the full value dict whenever anything changes - a direct
   * edit, a rule forcing a value, or a stale select value getting cleared */
  onChange?: (values: SimpleFormValueDict) => void
  className?: string
  style?: React.CSSProperties
}

/**
 * The embeddable AYON simple form: renders `fields` (as built by
 * ayon_server.forms.SimpleForm) with live rule evaluation and enumResolver
 * fetching. Owns its own field state - drop it in a dialog, a page, a
 * sidebar, wherever; `onChange` is how a parent reads the current values.
 *
 * See useFormState for the rule/resolver "engine"; this component is just
 * the render loop over its output.
 */
export const SimpleForm = ({ fields, values, onChange, className, style }: SimpleFormProps) => {
  const { formData, patches, resolvedOptions, setFieldValue } = useFormState(fields, values)

  useEffect(() => {
    if (formData) onChange?.(formData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData])

  if (!formData) return null

  return (
    <FormLayout
      className={className}
      style={style}
      onKeyDown={(e) => {
        e.stopPropagation()
      }}
    >
      {fields.map((field: SimpleFormField) => {
        const patch = patches[field.name]
        const options = getFieldOptions(field, patch, resolvedOptions)

        // `patch.value` (if a rule forces one) isn't read from here - FormField
        // uses the `value` prop below, not field.value - only the display-affecting
        // properties matter for `effectiveField`.
        const effectiveField = { ...field, ...patch } as SimpleFormField
        if (options !== undefined) {
          effectiveField.options = options
          const loading = field.enumResolver && resolvedOptions[field.name]?.loading
          if (loading && effectiveField.placeholder === undefined) {
            effectiveField.placeholder = 'Loading...'
          }
        }

        if (effectiveField.hidden) return null

        if (effectiveField.type === 'label') {
          return <FormLabel key={field.name} field={effectiveField} />
        }

        return (
          <FormRow key={field.name} label={effectiveField.label || ''}>
            <FormField
              field={effectiveField}
              value={formData[field.name]}
              onChange={(value) => setFieldValue(field.name, value)}
            />
          </FormRow>
        )
      })}
    </FormLayout>
  )
}
