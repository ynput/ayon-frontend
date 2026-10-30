import { ObjectFieldTemplateProps } from '@rjsf/utils'
import { ReactNode } from 'react'
import { toast } from 'react-toastify'
import { $Any } from '@types'
import { Badge, BadgeWrapper } from '@shared/components'
import { copyToClipboard } from '@shared/util'
import { arrayStartsWith } from './searchMatcher'
import ReactMarkdown from 'react-markdown'
import type { MouseEvent } from 'react'
import type { ContextMenuItemType } from '@shared/containers/ContextMenu'

export const getObjectOverrideLevel = (
  changedKeys: ObjectFieldTemplateProps['formContext']['changedKeys'],
  overrides: ObjectFieldTemplateProps['formContext']['overrides'],
  path?: $Any[],
) => {
  for (const changedPath of changedKeys) {
    if (arrayStartsWith(changedPath, path)) return 'edit'
  }

  for (const changedId in overrides) {
    const changedPath = overrides[changedId].path
    if (arrayStartsWith(changedPath, path)) return overrides[changedId].level
  }

  return 'default'
}

export const buildLongDescription = (description?: string) =>
  description ? (
    <div className="form-object-field-help">
      <ReactMarkdown>{description}</ReactMarkdown>
    </div>
  ) : null

export const getEnabledToggler = (
  properties: ObjectFieldTemplateProps['properties'],
): ReactNode => {
  const enabledProperty = properties.find((element) => element?.name === 'enabled')
  return enabledProperty ? (
    <span className="form-object-header-enabled-toggler">{enabledProperty.content}</span>
  ) : undefined
}

export const showObjectContextMenu = (
  event: $Any,
  onSetBreadcrumbs: ObjectFieldTemplateProps['formContext']['onSetBreadcrumbs'],
  path: $Any[] | undefined,
  contextMenuModel: ContextMenuItemType[],
  contextMenu: (event: MouseEvent, model?: ContextMenuItemType[]) => void,
) => {
  onSetBreadcrumbs?.(path || [])
  if (!contextMenuModel.length) return
  event.preventDefault()
  contextMenu(event, contextMenuModel)
}

type ObjectTitleArgs = {
  title: ReactNode
  schema: ObjectFieldTemplateProps['schema']
  formData: ObjectFieldTemplateProps['formData']
  objectId: string
  formTitle?: string
  headerProjectName?: string
  headerSiteId?: string
  headerVariant?: string
  listItem?: { named: boolean; fallbackTitle: ReactNode } | null
}

export const buildObjectTitle = ({
  title,
  schema,
  formData,
  objectId,
  formTitle,
  headerProjectName,
  headerSiteId,
  headerVariant,
  listItem,
}: ObjectTitleArgs) => {
  let stringTitle = title
  if ('name' in (schema.properties || {})) {
    const label = 'label' in (schema.properties || {}) ? formData?.label : null
    stringTitle = label || formData?.name || <span className="new-object">Unnamed item</span>
  }

  if (objectId === 'root' && formTitle) stringTitle = formTitle

  let titleComponent = stringTitle
  if (objectId === 'root') {
    const envColor =
      headerVariant && ['production', 'staging'].includes(headerVariant)
        ? headerVariant
        : 'developer'
    titleComponent = (
      <>
        {stringTitle}
        <BadgeWrapper>
          {headerProjectName && <Badge color="project" label={headerProjectName} />}
          {headerSiteId && <Badge color="site" label={headerSiteId} />}
          {headerVariant && <Badge color={envColor} label={headerVariant} />}
        </BadgeWrapper>
      </>
    )
  }

  return listItem && !listItem.named ? listItem.fallbackTitle : titleComponent
}

type OverrideContextMenuArgs = {
  /** The form root: its menu removes all overrides at once instead of pinning one */
  isRoot?: boolean
  level: string
  onRemoveAllOverrides?: () => void
  onPinOverride?: (path: $Any[]) => void
  onRemoveOverride?: (path: $Any[]) => void
  onPasteValue?: (path: $Any[]) => void
  formData: ObjectFieldTemplateProps['formData']
  override?: $Any
  overrideLevel: string
  path?: $Any[]
}

/** The context menu of a field or group: pin or remove its override, copy and paste its value */
export const buildOverrideContextMenu = ({
  isRoot,
  level,
  onRemoveAllOverrides,
  onPinOverride,
  onRemoveOverride,
  onPasteValue,
  formData,
  override,
  overrideLevel,
  path,
}: OverrideContextMenuArgs) => {
  const model = []

  if (isRoot) {
    model.push({
      label: `Remove all ${level} overrides`,
      disabled: !onRemoveAllOverrides,
      command: () => onRemoveAllOverrides?.(),
    })
  } else {
    const rmPath = override?.inGroup || path || ['root']
    if (onPinOverride) {
      model.push({
        label: `Add current ${rmPath[rmPath.length - 1]} value as ${level} override`,
        command: () => onPinOverride(rmPath),
        disabled: overrideLevel === level,
      })
    }
    if (onRemoveOverride) {
      model.push({
        label: `Remove ${level} override from ${rmPath[rmPath.length - 1]}`,
        command: () => onRemoveOverride(rmPath),
        disabled: overrideLevel !== level,
      })
    }
  }

  model.push(
    {
      label: 'Copy',
      command: () => {
        if (!formData || (Array.isArray(formData) && formData.length === 0)) {
          toast.warn('No data to copy')
          return
        }
        copyToClipboard(JSON.stringify(formData, null, 2))
      },
    },
    {
      label: 'Paste',
      disabled: !onPasteValue,
      command: () => onPasteValue?.(path || []),
    },
  )
  return model
}
