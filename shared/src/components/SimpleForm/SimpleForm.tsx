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
  /** Called on Enter in a single-line field (text or number), like submitting an HTML form */
  onSubmit?: () => void
  className?: string
  style?: React.CSSProperties
}

// Input types where Enter submits a native HTML form
const SUBMIT_INPUT_TYPES = ['text', 'number', 'search', 'email', 'password', 'url', 'tel']

// Enter in a single-line field. Not in a textarea (new line), not on a switch or dropdown
// (they handle Enter themselves and call preventDefault), not with a modifier.
const isSubmitKey = (e: React.KeyboardEvent<HTMLElement>) => {
  if (e.key !== 'Enter' || e.defaultPrevented || e.nativeEvent.isComposing) return false
  if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return false
  const target = e.target as HTMLElement
  return target instanceof HTMLInputElement && SUBMIT_INPUT_TYPES.includes(target.type)
}

/**
 * The embeddable AYON simple form: renders `fields` (as built by
 * ayon_server.forms.SimpleForm) with live rule evaluation and enum_resolver
 * fetching. Owns its own field state - drop it in a dialog, a page, a
 * sidebar, wherever; `onChange` is how a parent reads the current values.
 *
 * See useFormState for the rule/resolver "engine"; this component is just
 * the render loop over its output.
 */
export const SimpleForm = ({
  fields,
  values,
  onChange,
  onSubmit,
  className,
  style,
}: SimpleFormProps) => {
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
        if (onSubmit && isSubmitKey(e)) {
          e.preventDefault()
          onSubmit()
        }
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
          const loading = field.enum_resolver && resolvedOptions[field.name]?.loading
          if (loading && effectiveField.placeholder === undefined) {
            effectiveField.placeholder = 'Loading...'
          }
        }

        const rowStyle: React.CSSProperties = {}

        if (effectiveField.hidden) {
          rowStyle.display = 'none'
        }

        if (effectiveField.type === 'label') {
          return <FormLabel key={field.name} field={effectiveField} />
        }

        return (
          <FormRow key={field.name} label={effectiveField.label || ''} style={rowStyle}>
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
