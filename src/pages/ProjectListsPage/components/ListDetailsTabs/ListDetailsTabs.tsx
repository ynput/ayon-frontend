import { Button, Toolbar } from '@ynput/ayon-react-components'
import { FC } from 'react'

export type ListDetailsTab = 'details' | 'sharing'

const tabs: { label: string; id: ListDetailsTab }[] = [
  { label: 'Details', id: 'details' },
  { label: 'Sharing', id: 'sharing' },
]

interface ListDetailsTabsProps {
  selected: ListDetailsTab
  onChange: (tab: ListDetailsTab) => void
}

const ListDetailsTabs: FC<ListDetailsTabsProps> = ({ selected, onChange }) => {
  return (
    <Toolbar>
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant={selected === tab.id ? 'surface' : 'text'}
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
