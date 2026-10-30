import { createContext, useContext } from 'react'

/**
 * Set by a list item that folds (an object drawn as a block of fields). The item's
 * own group reads it to draw the fold control, then resets it for the groups inside.
 */
export type SettingsListItemState = {
  expanded: boolean
  onToggle: () => void
  /** Whether the item has a name of its own (its title) */
  named: boolean
  /** The field the item is titled by (name, label or title): it leads the open item */
  leadField?: string
  /** A few of the item's values, shown at the end of its title row while it's folded */
  summary: string
  /** Title for an item without a name: its label or title, else its first value or position */
  fallbackTitle: string
  /** Nothing to show inside (no fields besides its switch): it can't open */
  empty: boolean
}

export const SettingsListItemContext = createContext<SettingsListItemState | null>(null)

export const useSettingsListItem = () => useContext(SettingsListItemContext)
