import { Button, Toolbar } from '@ynput/ayon-react-components'
import type { IconType } from '@ynput/ayon-react-components'
import { prefetchPiece } from '@ynput/ayon-addon'
import type { Contribution } from '@ynput/ayon-addon'
import { contributionTags } from '@ynput/ayon-addon/host'
import { FC } from 'react'

/** the panel's own tabs, or an addon's (listDetails.tab slot): its contribution key */
export type ListDetailsTab = 'details' | 'access' | (string & {})

export const LIST_DETAILS_TABS: { label: string; id: ListDetailsTab; icon: IconType }[] = [
  { label: 'Details', id: 'details', icon: 'lists' },
  { label: 'Share', id: 'access', icon: 'share' },
]

interface ListDetailsTabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  selected: ListDetailsTab
  onChange: (tab: ListDetailsTab) => void
  /** the addons' tabs, after the panel's own */
  addonTabs?: Contribution<'listDetails.tab'>[]
}

const ListDetailsTabs: FC<ListDetailsTabsProps> = ({
  selected,
  onChange,
  addonTabs = [],
  ...props
}) => {
  if (LIST_DETAILS_TABS.length + addonTabs.length === 1) return null

  return (
    <Toolbar {...props}>
      {LIST_DETAILS_TABS.map((tab) => (
        <Button
          key={tab.id}
          variant={selected === tab.id ? 'surface' : 'text'}
          icon={tab.icon}
          selected={selected === tab.id}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </Button>
      ))}
      {/* the buttons show from the descriptions; a tab's code loads when it is opened */}
      {addonTabs.map((tab) => (
        <Button
          key={tab.key}
          variant={selected === tab.key ? 'surface' : 'text'}
          // addons name any Material Symbols icon
          icon={tab.icon as IconType}
          selected={selected === tab.key}
          onClick={() => onChange(tab.key)}
          onMouseEnter={() => prefetchPiece(tab.component)}
          data-addon-tab={tab.key}
          // the slot inspector's tags, while it is on
          {...contributionTags(tab)}
        >
          {tab.label}
        </Button>
      ))}
    </Toolbar>
  )
}

export default ListDetailsTabs
