// The developer panel's contributions, by the area of AYON they show in, then by the part of that
// area (the project's tables, the studio's project list), then by slot.
import type { SlotName } from '@ynput/ayon-addon'

export interface SlotSection {
  /** the part of the area; none for the area's own slots */
  label?: string
  slots: { slot: SlotName; label: string }[]
}

export interface SlotArea {
  label: string
  icon: string
  sections: SlotSection[]
}

export const SLOT_AREAS: SlotArea[] = [
  {
    label: 'App header',
    icon: 'web_asset',
    sections: [{ slots: [{ slot: 'header.item', label: 'Items' }] }],
  },
  {
    label: 'Studio',
    icon: 'home',
    sections: [
      { slots: [{ slot: 'studio.page', label: 'Pages' }] },
      { label: 'Project list', slots: [{ slot: 'projectList.menuItem', label: 'Menu' }] },
    ],
  },
  {
    label: 'Project',
    icon: 'folder_open',
    sections: [
      { slots: [{ slot: 'project.page', label: 'Pages' }] },
      { label: 'Slicer', slots: [{ slot: 'slicer.menuItem', label: 'Menu' }] },
      {
        label: 'Tables',
        slots: [
          { slot: 'tableColumn', label: 'Columns' },
          { slot: 'entityMenuItem', label: 'Cell menu' },
          { slot: 'table.shortcut', label: 'Shortcuts' },
          { slot: 'projectTable.toolbarItem', label: 'Toolbar' },
          { slot: 'projectTable.customizeSection', label: 'Customize panel' },
        ],
      },
    ],
  },
  {
    label: 'Details panel',
    icon: 'dock_to_left',
    sections: [
      {
        slots: [
          { slot: 'detailsPanel.tab', label: 'Tabs' },
          { slot: 'detailsPanel.menuItem', label: 'More menu' },
        ],
      },
    ],
  },
]

/** Where a slot is, as labels from its area down: Project › Tables › Cell menu. */
export const slotPath = (slot: string): string[] => {
  for (const area of SLOT_AREAS) {
    for (const section of area.sections) {
      const found = section.slots.find((s) => s.slot === slot)
      if (found) return [area.label, ...(section.label ? [section.label] : []), found.label]
    }
  }
  // slots added to the SDK after this list
  return ['Other', slot]
}

/** The icon of a slot's area. */
export const slotIcon = (slot: string) =>
  SLOT_AREAS.find((area) => area.sections.some((s) => s.slots.some((x) => x.slot === slot)))?.icon ||
  'extension'
