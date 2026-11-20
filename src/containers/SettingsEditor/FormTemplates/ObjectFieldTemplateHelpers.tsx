import { ObjectFieldTemplateProps } from '@rjsf/utils'
import { ReactNode } from 'react'
import { upperFirst } from 'lodash'
import { toast } from 'react-toastify'
import { $Any } from '@types'
import { NO_EDIT_PERMISSION } from './readOnlySettings'
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
    const isMainVariant = !!headerVariant && ['production', 'staging'].includes(headerVariant)
    const envColor = isMainVariant ? headerVariant : 'developer'
    // production and staging are named like the variant buttons, a dev bundle by its name
    const envLabel = isMainVariant ? upperFirst(headerVariant) : headerVariant
    titleComponent = (
      <>
        {stringTitle}
        {/* the outline names the sheet without these (readSettingsOutline) */}
        <BadgeWrapper className="settings-title-badges">
          {headerProjectName && <Badge color="project" label={headerProjectName} />}
          {headerSiteId && <Badge color="site" label={headerSiteId} />}
          {headerVariant && <Badge color={envColor} label={envLabel} />}
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
  /** Groups only: opens the group's raw settings (SettingsJsonDialog), under this title, read
   * only (greyed out Confirm) for the reason given */
  onEditJson?: (path: $Any[], title: string, readOnlyReason?: string) => void
  /** Why the value can't be changed here (readOnlySettings): Paste is greyed out, and without
   * edit permissions the override actions too */
  readOnlyReason?: string
  jsonTitle?: string
  formData: ObjectFieldTemplateProps['formData']
  override?: $Any
  overrideLevel: string
  path?: $Any[]
}

/** The context menu of a field or group: pin or remove its override, copy and paste its value,
 * and for a group, edit its raw settings */
export const buildOverrideContextMenu = ({
  isRoot,
  level,
  onRemoveAllOverrides,
  onPinOverride,
  onRemoveOverride,
  onPasteValue,
  onEditJson,
  jsonTitle,
  formData,
  override,
  overrideLevel,
  path,
  readOnlyReason,
}: OverrideContextMenuArgs) => {
  const model = []
  const noPermission = readOnlyReason === NO_EDIT_PERMISSION

  if (isRoot) {
    model.push({
      label: `Remove all ${level} overrides`,
      disabled: !onRemoveAllOverrides || noPermission,
      command: () => onRemoveAllOverrides?.(),
    })
  } else {
    const rmPath = override?.inGroup || path || ['root']
    if (onPinOverride) {
      model.push({
        label: `Add current ${rmPath[rmPath.length - 1]} value as ${level} override`,
        command: () => onPinOverride(rmPath),
        disabled: overrideLevel === level || noPermission,
      })
    }
    if (onRemoveOverride) {
      model.push({
        label: `Remove ${level} override from ${rmPath[rmPath.length - 1]}`,
        command: () => onRemoveOverride(rmPath),
        disabled: overrideLevel !== level || noPermission,
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
      disabled: !onPasteValue || !!readOnlyReason,
      command: () => onPasteValue?.(path || []),
    },
  )
  if (onEditJson) {
    model.push({
      label: 'Edit raw settings...',
      command: () => onEditJson(path || [], jsonTitle || 'Settings', readOnlyReason),
    })
  }
  return model
}
