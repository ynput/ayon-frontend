import { MouseEvent, useMemo } from 'react'
import isEqual from 'lodash/isEqual'
import { Registry } from '@rjsf/utils'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import { $Any } from '@types'
import { buildOverrideContextMenu } from './ObjectFieldTemplateHelpers'
import { getReadOnlyReason } from './readOnlySettings'
import { useFormContextSelector } from '../formContextStore'

type FieldOverrideOptions = {
  fieldId: string
  /** The field's schema and value: a read-only field greys out the menu's edits */
  schema: $Any
  value: unknown
  formContext: $Any
  registry: Registry
}

/**
 * A field's override level (default, studio, project, site, or edit once changed), its
 * right-click menu and its breadcrumb, as FieldTemplate gives a field's label. For controls
 * that draw a field's label themselves (the column headings of a directory mapping).
 */
export const useFieldOverride = ({
  fieldId,
  schema,
  value,
  formContext,
  registry,
}: FieldOverrideOptions) => {
  const [contextMenu] = useCreateContextMenu([])
  const { override, changed } = useFormContextSelector(formContext, (context) => {
    const fieldOverride = context.overrides?.[fieldId] ?? null
    const fieldPath = fieldOverride?.path || []
    return {
      override: fieldOverride,
      changed: (context.changedKeys || []).some((key: unknown) => isEqual(key, fieldPath)),
    }
  })
  const { level, onPinOverride, onRemoveOverride, onPasteValue, onSetBreadcrumbs } = formContext
  const path: string[] = useMemo(() => override?.path || [], [override?.path])
  const overrideLevel: string = changed ? 'edit' : override?.level || 'default'

  // built when it opens, like FieldTemplate's: whether the field is read-only walks its value
  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    contextMenu(
      e,
      buildOverrideContextMenu({
        level,
        onPinOverride,
        onRemoveOverride,
        onPasteValue,
        formData: value,
        override,
        overrideLevel,
        path,
        readOnlyReason: getReadOnlyReason(formContext, schema, value, registry),
      }),
    )
    if (onSetBreadcrumbs && path.length) onSetBreadcrumbs(path)
  }
  const onSelect = () => {
    if (onSetBreadcrumbs && path.length) onSetBreadcrumbs(path)
  }

  return { path, overrideLevel, onContextMenu, onSelect }
}
