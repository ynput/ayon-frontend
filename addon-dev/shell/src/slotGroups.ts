// The developer panel's contributions, grouped by where AYON shows them, then by slot.
import type { SlotName } from '@ynput/ayon-addon'

export interface SlotGroup {
  label: string
  slots: { slot: SlotName; label: string }[]
}

export const SLOT_GROUPS: SlotGroup[] = [
  { label: 'Header', slots: [{ slot: 'header.item', label: 'Items' }] },
  {
    label: 'Studio (dashboard)',
    slots: [
      { slot: 'studio.page', label: 'Pages' },
      { slot: 'projectList.menuItem', label: 'Project list menu' },
    ],
  },
  {
    label: 'Project',
    slots: [
      { slot: 'project.page', label: 'Pages' },
      { slot: 'slicer.menuItem', label: 'Slicer menu' },
    ],
  },
  {
    label: 'Project tables',
    slots: [
      { slot: 'tableColumn', label: 'Columns' },
      { slot: 'entityMenuItem', label: 'Cell menu' },
      { slot: 'projectTable.toolbarItem', label: 'Toolbar' },
      { slot: 'projectTable.customizeSection', label: 'Customize sections' },
    ],
  },
  {
    label: 'Details panel',
    slots: [
      { slot: 'detailsPanel.tab', label: 'Tabs' },
      { slot: 'detailsPanel.menuItem', label: 'More menu' },
    ],
  },
]

/** The group and label of a slot; slots added to the SDK after this list go under Other. */
export const slotGroup = (slot: string) => {
  for (const group of SLOT_GROUPS) {
    const found = group.slots.find((s) => s.slot === slot)
    if (found) return { group, label: found.label }
  }
  return { group: undefined, label: slot }
}
