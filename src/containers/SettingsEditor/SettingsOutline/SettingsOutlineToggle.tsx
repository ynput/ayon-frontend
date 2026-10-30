import { Button } from '@ynput/ayon-react-components'
import { useSettingsOutlineCollapsed } from './useSettingsOutlineCollapsed'
import { useOutlineAvailable } from './outlineAvailability'

/**
 * A toolbar button that hides and shows the settings outline. Only a page showing an outline
 * has one: the flat layout with two or more groups (an outline announces itself while it is
 * mounted). Elsewhere there is nothing to hide, so it renders nothing.
 */
export const SettingsOutlineToggle = () => {
  const [collapsed, setCollapsed] = useSettingsOutlineCollapsed()
  const outlineAvailable = useOutlineAvailable()

  if (!outlineAvailable) return null

  const label = collapsed ? 'Show outline' : 'Hide outline'

  return (
    <Button
      icon={collapsed ? 'left_panel_open' : 'left_panel_close'}
      aria-label={label}
      aria-expanded={!collapsed}
      data-tooltip={label}
      onClick={() => setCollapsed((prev) => !prev)}
    />
  )
}
