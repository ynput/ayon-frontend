// The host's TabbedPanel (@ynput/ayon-addon): AYON's own, with a failing "more" menu item shown as
// a toast naming the addon.
import type { HostTabbedPanelProps } from '@ynput/ayon-addon/host'
import { TabbedPanel } from '@shared/components/TabbedPanel'
import type { PanelTab } from '@shared/components/PanelTabs'

export const AddonTabbedPanel = ({ onError, tabs, ...props }: HostTabbedPanelProps) => (
  // an addon names its icons as strings
  <TabbedPanel {...props} tabs={tabs as PanelTab[]} onToolError={onError} />
)
