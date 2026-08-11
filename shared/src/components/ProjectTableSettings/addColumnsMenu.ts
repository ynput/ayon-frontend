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
  // entity sections only exist on tables that show that entity
  requiresScope?: string
  match: (item: AddColumnItem) => boolean
}

// entity sections claim their attributes before the generic custom-attributes section
const ADD_COLUMN_SECTIONS: AddColumnSection[] = [
  {
    id: 'version-attributes',
    label: 'Version attributes',
    icon: 'layers',
    requiresScope: 'version',
    match: (item) => !!item.attrib?.scope?.includes('version'),
  },
  {
    id: 'custom-attributes',
    label: 'Custom attributes',
    icon: 'text_fields',
    match: (item) => !!item.attrib && !item.attrib.builtin,
  },
  { id: 'links', label: 'Links', icon: 'link', match: (item) => !!item.isLink },
]

const getActiveAddColumnSections = (scopes: string[] = []): AddColumnSection[] =>
  ADD_COLUMN_SECTIONS.filter(
    (section) => !section.requiresScope || scopes.includes(section.requiresScope),
  )

export const getAddColumnSection = (
  item: AddColumnItem,
  scopes: string[] = [],
): AddColumnSection | undefined =>
  getActiveAddColumnSections(scopes).find((section) => section.match(item))

export const buildAddColumnsMenu = ({
  columns,
  onAdd,
  scopes = [],
  extraItems = [],
}: {
  columns: AddColumnItem[]
  onAdd: (columnId: string) => void
  scopes?: string[]
  // page actions appended at the end, e.g. Lists' "List attributes"
  extraItems?: MenuItemType[]
}): MenuItemType[] => {
  const toMenuItem = (column: AddColumnItem): MenuItemType => ({
    id: column.value,
    label: column.label,
    icon: column.icon,
    disableClose: true,
    onClick: () => onAdd(column.value),
  })

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
