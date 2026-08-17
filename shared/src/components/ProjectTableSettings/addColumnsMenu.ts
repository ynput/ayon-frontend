import type { MenuItemType } from '../Menu'
import type { SettingsPanelItem } from '../SettingsPanel/SettingsPanelItemTemplate'

export type AddColumnItem = SettingsPanelItem & {
  attrib?: { builtin?: boolean; scope?: string[] }
  isLink?: boolean
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

const getActiveAddColumnSections = (scopes: string[] = []): AddColumnSection[] => [
  {
    id: 'attributes',
    label: getAttributesLabel(scopes),
    icon: 'text_fields',
    match: (item) => !!item.attrib,
  },
  { id: 'links', label: 'Links', icon: 'link', match: (item) => !!item.isLink },
]

export const getAddColumnSection = (
  item: AddColumnItem,
  scopes: string[] = [],
): AddColumnSection | undefined =>
  getActiveAddColumnSections(scopes).find((section) => section.match(item))

export const buildAddColumnsMenu = ({
  columns,
  onToggle,
  isColumnVisible,
  scopes = [],
  extraItems = [],
}: {
  columns: AddColumnItem[]
  onToggle: (columnId: string) => void
  isColumnVisible: (columnId: string) => boolean
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
      disableClose: true,
      active: visible,
      onClick: () => onToggle(column.value),
    }
  }

  const activeSections = getActiveAddColumnSections(scopes)

  const sectioned = new Map(activeSections.map((section) => [section.id, [] as AddColumnItem[]]))
  const topLevel: AddColumnItem[] = []

  columns.forEach((column) => {
    const section = activeSections.find((s) => s.match(column))
    if (section) sectioned.get(section.id)?.push(column)
    else topLevel.push(column)
  })

  const sectionItems: MenuItemType[] = activeSections
    .filter((section) => sectioned.get(section.id)?.length)
    .map((section) => ({
      id: section.id,
      label: section.label,
      icon: section.icon,
      items: (sectioned.get(section.id) as AddColumnItem[])
        .toSorted((a, b) => a.label.localeCompare(b.label))
        .map(toMenuItem),
    }))

  const groups = [topLevel.map(toMenuItem), sectionItems, extraItems].filter(
    (group) => group.length,
  )

  return groups.flatMap((group, i) => (i ? [{ id: 'divider' }, ...group] : group))
}
