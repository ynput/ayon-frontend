// PROTOTYPE (navigation mix): the user's choice for the sidebar, next to Theme
import { Button, Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import {
  setSidebarChoice,
  STUDIO_SIDEBAR_DEFAULT,
  useSidebarPreference,
  type SidebarChoice,
} from '@containers/Navigation/useSidebarPreference'
import * as Styled from './UserMenu.styled'

const OPTIONS = [
  { value: 'on', label: 'On', icon: 'left_panel_open', tooltip: 'Show the sidebar' },
  { value: 'off', label: 'Off', icon: 'left_panel_close', tooltip: 'Hide the sidebar' },
  {
    value: 'studio',
    label: 'Studio',
    icon: 'domain',
    tooltip: `The studio's default (${STUDIO_SIDEBAR_DEFAULT ? 'on' : 'off'})`,
  },
] as const satisfies readonly { value: SidebarChoice; label: string; icon: string; tooltip: string }[]

const SidebarSwitcher = () => {
  const { choice } = useSidebarPreference()
  return (
    <Styled.Theme>
      <Styled.ThemeLabel>
        <Icon icon="side_navigation" />
        Sidebar
      </Styled.ThemeLabel>
      <Styled.ThemeOptions role="radiogroup" aria-label="Sidebar">
        {OPTIONS.map(({ value, label, icon, tooltip }) => (
          <Button
            key={value}
            variant="text"
            icon={icon}
            label={label}
            role="radio"
            aria-checked={value === choice}
            data-tooltip={tooltip}
            className={clsx({ selected: value === choice })}
            onClick={() => setSidebarChoice(value)}
          />
        ))}
      </Styled.ThemeOptions>
    </Styled.Theme>
  )
}

export default SidebarSwitcher
