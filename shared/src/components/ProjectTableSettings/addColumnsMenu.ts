import type React from 'react'
import type { MenuItemType } from '../Menu'
import type { SettingsPanelItem } from '../SettingsPanel/SettingsPanelItemTemplate'
import type { EntityType } from '@shared/containers'
import { getEntityTypeIcon } from '@shared/util'

export type AddColumnItem = SettingsPanelItem & {
  attrib?: { builtin?: boolean; scope?: string[] }
  isLink?: boolean
  parentScope?: EntityType
}

export type AddColumnSection = {
  id: string
  label: string
  icon: string
  match: (item: AddColumnItem) => boolean
}

// tables showing a single entity name their attributes after it, mixed tables stay generic
const getAttributesLabel = (scopes: string[]) =>
  scopes.length === 1
    ? `${scopes[0].charAt(0).toUpperCase() + scopes[0].slice(1)} attributes`
    : 'Attributes'

const getActiveAddColumnSections = (
  scopes: string[] = [],
  columns: AddColumnItem[] = [],
): AddColumnSection[] => [
  {
    id: 'attributes',
    label: getAttributesLabel(scopes),
    icon: 'text_fields',
    match: (item) => !!item.attrib && !item.parentScope,
  },
  { id: 'links', label: 'Links', icon: 'link', match: (item) => !!item.isLink },
  ...Array.from(new Set(columns.map((column) => column.parentScope).filter(Boolean))).map(
    (parentScope) => ({
      id: `parent-${parentScope}`,
      label: `${(parentScope as string).charAt(0).toUpperCase()}${(parentScope as string).slice(
        1,
      )} fields`,
      icon: getEntityTypeIcon(parentScope as string),
      match: (item: AddColumnItem) => item.parentScope === parentScope,
    }),
  ),
]

export const getAddColumnSection = (
  item: AddColumnItem,
  scopes: string[] = [],
): AddColumnSection | undefined =>
  getActiveAddColumnSections(scopes, [item]).find((section) => section.match(item))

export const buildAddColumnsMenu = ({
  columns,
  onToggle,
  isColumnVisible,
  onPaintStart,
  onPaintEnter,
  onDragStart,
  scopes = [],
  extraItems = [],
}: {
  columns: AddColumnItem[]
  onToggle: (columnId: string) => void
  isColumnVisible: (columnId: string) => boolean
  // pressing an item and dragging over others applies the same show/hide to all of them
  onPaintStart?: (columnId: string) => void
  onPaintEnter?: (columnId: string, pressed: boolean) => void
  // pressing an item and dragging out of the menu drops the column into the table header
  onDragStart?: (column: AddColumnItem, event: React.PointerEvent) => void
  scopes?: string[]
  // page actions appended at the end, e.g. Lists' "List attributes"
  extraItems?: MenuItemType[]
}): MenuItemType[] => {
  const toMenuItem = (column: AddColumnItem): MenuItemType => {
    const visible = isColumnVisible(column.value)
    return {
      id: column.value,
      label: column.label,
      icon: column.icon,
      hoverIcon: onDragStart ? 'drag_indicator' : undefined,
      disableClose: true,
      active: visible,
      reserveActiveSlot: true,
      onClick: () => onToggle(column.value),
      onPointerDown: (event: React.PointerEvent) => {
        onPaintStart?.(column.value)
        onDragStart?.(column, event)
      },
      onPointerEnter: (event: React.PointerEvent) =>
        onPaintEnter?.(column.value, event.buttons > 0),
    }
  }

  const activeSections = getActiveAddColumnSections(scopes, columns)

  const sectioned = new Map(activeSections.map((section) => [section.id, [] as AddColumnItem[]]))
  const topLevel: AddColumnItem[] = []

  columns.forEach((column) => {
    const section = activeSections.find((s) => s.match(column))
    if (section) sectioned.get(section.id)?.push(column)
    else topLevel.push(column)
  })

  const sectionItems: MenuItemType[] = activeSections
    .filter((section) => sectioned.get(section.id)?.length)
    .map((section) => {
      const sectionColumns = sectioned.get(section.id) as AddColumnItem[]
      const attributeColumns = sectionColumns.filter((column) => !!column.attrib)
      const fieldItems = sectionColumns
        .filter((column) => !column.attrib)
        .toSorted((a, b) => a.label.localeCompare(b.label))
        .map(toMenuItem)

      if (!section.id.startsWith('parent-')) {
        return {
          id: section.id,
          label: section.label,
          icon: section.icon,
          items: sectionColumns.toSorted((a, b) => a.label.localeCompare(b.label)).map(toMenuItem),
        }
      }

      const parentScope = section.id.replace('parent-', '')
      return {
        id: section.id,
        label: section.label,
        icon: section.icon,
        items: [
          ...fieldItems,
          ...(attributeColumns.length
            ? [
                {
                  id: `${section.id}-attributes`,
                  label: `${parentScope.charAt(0).toUpperCase()}${parentScope.slice(1)} attributes`,
                  icon: 'text_fields',
                  items: attributeColumns
                    .toSorted((a, b) => a.label.localeCompare(b.label))
                    .map(toMenuItem),
                },
              ]
            : []),
        ],
      }
    })

  const groups = [topLevel.map(toMenuItem), sectionItems, extraItems].filter(
    (group) => group.length,
  )

  return groups.flatMap((group, i) => (i ? [{ id: 'divider' }, ...group] : group))
}
