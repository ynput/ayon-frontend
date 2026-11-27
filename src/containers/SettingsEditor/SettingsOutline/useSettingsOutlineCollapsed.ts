import { useLocalStorage } from '@shared/hooks'

/**
 * Whether the outline rail is hidden. Remembered across pages and visits, and shared by
 * every instance, so a toolbar button and the rail itself always agree.
 */
export const useSettingsOutlineCollapsed = () =>
  useLocalStorage('settings-outline-collapsed', false)
