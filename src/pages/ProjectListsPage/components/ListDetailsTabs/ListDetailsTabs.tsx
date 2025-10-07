import { Button, Toolbar } from '@ynput/ayon-react-components'
import { FC } from 'react'

export type ListDetailsTab = 'details' | 'access'

const tabs: { label: string; id: ListDetailsTab; icon: string }[] = [
  { label: 'Details', id: 'details', icon: 'info' },
  { label: 'Sharing', id: 'access', icon: 'share' },
]

interface ListDetailsTabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  selected: ListDetailsTab
  onChange: (tab: ListDetailsTab) => void
}

const ListDetailsTabs: FC<ListDetailsTabsProps> = ({ selected, onChange, ...props }) => {
  if (tabs.length === 1) return null

  return (
    <Toolbar {...props}>
      {tabs.map((tab) => (
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
    </Toolbar>
  )
}

export default ListDetailsTabs
