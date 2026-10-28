// what the developer panel asks for, per slot
const NO_PROJECT: string[] = ['studio.page', 'header.item', 'projectList.menuItem']
const ENTITIES: string[] = ['detailsPanel.tab', 'detailsPanel.menuItem', 'entityMenuItem', 'tableColumn']
const TABLE_PAGE: string[] = [
  'entityMenuItem',
  'tableColumn',
  'projectTable.toolbarItem',
  'projectTable.customizeSection',
]
const RUN: string[] = [
  'detailsPanel.menuItem',
  'projectList.menuItem',
  'slicer.menuItem',
  'entityMenuItem',
]

export const needsProject = (slot?: string) => !!slot && !NO_PROJECT.includes(slot)
export const needsEntities = (slot?: string) => !!slot && ENTITIES.includes(slot)
export const needsTablePage = (slot?: string) => !!slot && TABLE_PAGE.includes(slot)
export const isMenuSlot = (slot?: string) => !!slot && RUN.includes(slot)

export const ENTITY_TYPES = ['folder', 'task', 'product', 'version'] as const
