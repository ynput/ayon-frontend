import { expect, test } from '@playwright/test'
import {
  getSlotHighlight,
  setHighlightedSlot,
  setSlotHighlight,
  slotEntries,
  slotEntry,
  slotPlaceholder,
  slotPlaceholderEntry,
  slotTriggerProps,
  subscribeSlotHighlight,
  withSlotEntries,
} from '../../shared/src/components/AddonLayout/slotHighlight'

// Slot highlighting: AYON's host menus tag their addon entries with their slot and add a
// placeholder for a slot without items, but only while highlighting is on. Off (as in the app
// today), the menus show exactly their items.

const SLOT = 'example.menuItem'
const item = { id: 'example.log', label: 'Log time', icon: 'timer', onClick: () => undefined }

test.describe('slot highlighting', () => {
  test.afterEach(() => setSlotHighlight(false))

  test('tags an entry with its slot as inert attributes, keeping the entry', () => {
    expect(slotEntry(SLOT, item)).toEqual({
      ...item,
      'data-ayon-slot': SLOT,
      'data-ayon-slot-entry': 'used',
    })
    // a placeholder passed through it stays one
    setSlotHighlight(true)
    expect(slotEntry(SLOT, slotPlaceholderEntry(SLOT, 'Menu item')!)).toMatchObject({
      'data-ayon-slot-entry': 'unused',
    })
  })

  test('tags a list of entries, leaving separators alone', () => {
    const separator = { separator: true }
    expect(slotEntries(SLOT, [item, separator])).toEqual([slotEntry(SLOT, item), separator])
  })

  test('off: no placeholder, and a menu without items stays empty', () => {
    expect(slotPlaceholderEntry(SLOT, 'Menu item')).toBeUndefined()
    expect(slotPlaceholder(SLOT, 'Menu item')).toBeUndefined()
    expect(withSlotEntries(SLOT, [], 'Menu item')).toEqual([])
    expect(withSlotEntries(SLOT, [item], 'Menu item')).toEqual([slotEntry(SLOT, item)])
  })

  test('on: a placeholder only where the slot has no items', () => {
    setSlotHighlight(true)
    const entry = slotPlaceholderEntry(SLOT, 'Menu item')
    expect(entry).toEqual({
      id: `ayon-slot:${SLOT}`,
      label: 'Menu item',
      icon: 'add',
      disabled: true,
      'data-ayon-slot': SLOT,
      'data-ayon-slot-entry': 'unused',
    })
    expect(entry).not.toHaveProperty('command')
    // the right-click menus' variant has a command that does nothing
    expect(slotPlaceholder(SLOT, 'Menu item')).toMatchObject({ ...entry, command: expect.any(Function) })
    expect(withSlotEntries(SLOT, [], 'Menu item')).toEqual([entry])
    expect(withSlotEntries(SLOT, [], 'Menu item', 'command')[0]).toHaveProperty('command')
    expect(withSlotEntries(SLOT, [item], 'Menu item')).toEqual([slotEntry(SLOT, item)])
  })

  test('the state: listeners hear changes, and turning it off forgets the singled out slot', () => {
    const heard: unknown[] = []
    const unsubscribe = subscribeSlotHighlight(() => heard.push(getSlotHighlight()))
    setSlotHighlight(true)
    setHighlightedSlot(SLOT)
    setHighlightedSlot(SLOT)
    setSlotHighlight(false)
    unsubscribe()
    expect(heard).toEqual([{ on: true }, { on: true, hovered: SLOT }, { on: false, hovered: undefined }])
  })

  test('marks the button that opens a slot menu', () => {
    expect(slotTriggerProps(SLOT)).toEqual({ 'data-ayon-slot': SLOT, 'data-ayon-slot-trigger': '' })
  })
})
