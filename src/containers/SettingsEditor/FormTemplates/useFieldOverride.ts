import { MouseEvent, useMemo } from 'react'
import isEqual from 'lodash/isEqual'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import { $Any } from '@types'
import { buildOverrideContextMenu } from './ObjectFieldTemplateHelpers'

/**
 * A field's override level (default, studio, project, site, or edit once changed), its
 * right-click menu and its breadcrumb, as FieldTemplate gives a field's label. For controls
 * that draw a field's label themselves (the column headings of a directory mapping).
 */
export const useFieldOverride = (fieldId: string, formContext: $Any, formData: unknown) => {
  const [contextMenu] = useCreateContextMenu([])
  const { level, onPinOverride, onRemoveOverride, onPasteValue, onSetBreadcrumbs, changedKeys } =
    formContext
  const override = formContext.overrides?.[fieldId] ?? null
  const path: string[] = useMemo(() => override?.path || [], [override?.path])

  const changed = useMemo(
    () => (changedKeys || []).some((key: unknown) => isEqual(key, path)),
    [changedKeys, path],
  )
  const overrideLevel: string = changed ? 'edit' : override?.level || 'default'

  const menuModel = useMemo(
    () =>
      buildOverrideContextMenu({
        level,
        onPinOverride,
        onRemoveOverride,
        onPasteValue,
        formData,
        override,
        overrideLevel,
        path,
      }),
    [level, onPasteValue, onPinOverride, onRemoveOverride, override, overrideLevel, path, formData],
  )

  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    contextMenu(e, menuModel)
    if (onSetBreadcrumbs && path.length) onSetBreadcrumbs(path)
  }
  const onSelect = () => {
    if (onSetBreadcrumbs && path.length) onSetBreadcrumbs(path)
  }

  return { path, overrideLevel, onContextMenu, onSelect }
}
