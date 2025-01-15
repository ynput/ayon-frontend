import { StatusSelect } from '@ynput/ayon-react-components'
import DropdownColumnWrapper from './DropdownColumnWrapper'
import { useState } from 'react'
const options = [
  {
    name: 'Not ready',
    shortName: 'NRD',
    state: 'not_started',
    icon: 'fiber_new',
    color: '#434a56',
    scope: ['product', 'version', 'representation', 'task', 'workfile'],
    original_name: 'Not ready',
  },
  {
    name: 'Ready to start',
    shortName: 'RDY',
    state: 'not_started',
    icon: 'timer',
    color: '#bababa',
    scope: ['product', 'version', 'representation', 'task', 'workfile'],
    original_name: 'Ready to start',
  },
  {
    name: 'In progress',
    shortName: 'PRG',
    state: 'in_progress',
    icon: 'play_arrow',
    color: '#3498db',
    scope: ['product', 'version', 'representation', 'task', 'workfile'],
    original_name: 'In progress',
  },
  {
    name: 'Pending review',
    shortName: 'RVW',
    state: 'in_progress',
    icon: 'visibility',
    color: '#ff9b0a',
    scope: ['product', 'version', 'representation', 'task', 'workfile'],
    original_name: 'Pending review',
  },
  {
    name: 'Approved',
    shortName: 'APP',
    state: 'done',
    icon: 'task_alt',
    color: '#00f0b4',
    scope: ['product', 'version', 'representation', 'task', 'workfile'],
    original_name: 'Approved',
  },
  {
    name: 'On hold',
    shortName: 'HLD',
    state: 'blocked',
    icon: 'back_hand',
    color: '#fa6e46',
    scope: ['version', 'representation', 'task', 'workfile', 'product'],
    original_name: 'On hold',
  },
  {
    name: 'Omitted',
    shortName: 'OMT',
    state: 'blocked',
    icon: 'block',
    color: '#cb1a1a',
    scope: ['product', 'version', 'representation', 'task', 'workfile'],
    original_name: 'Omitted',
  },
]

const optionsMap = {
  'Not Ready': {
    name: 'Not ready',
    shortName: 'NRD',
    state: 'not_started',
    icon: 'fiber_new',
    color: '#434a56',
    scope: ['product', 'version', 'representation', 'task', 'workfile'],
    original_name: 'Not ready',
  },
  'Not ready': {
    name: 'Not ready',
    shortName: 'NRD',
    state: 'not_started',
    icon: 'fiber_new',
    color: '#434a56',
    scope: ['product', 'version', 'representation', 'task', 'workfile'],
    original_name: 'Not ready',
  },
  'Ready to start': {
    name: 'Ready to start',
    shortName: 'RDY',
    state: 'not_started',
    icon: 'timer',
    color: '#bababa',
    scope: ['product', 'version', 'representation', 'task', 'workfile'],
    original_name: 'Ready to start',
  },
  'In progress': {
    name: 'In progress',
    shortName: 'PRG',
    state: 'in_progress',
    icon: 'play_arrow',
    color: '#3498db',
    scope: ['product', 'version', 'representation', 'task', 'workfile'],
    original_name: 'In progress',
  },
  'Pending review': {
    name: 'Pending review',
    shortName: 'RVW',
    state: 'in_progress',
    icon: 'visibility',
    color: '#ff9b0a',
    scope: ['product', 'version', 'representation', 'task', 'workfile'],
    original_name: 'Pending review',
  },
  Approved: {
    name: 'Approved',
    shortName: 'APP',
    state: 'done',
    icon: 'task_alt',
    color: '#00f0b4',
    scope: ['product', 'version', 'representation', 'task', 'workfile'],
    original_name: 'Approved',
  },
  'On hold': {
    name: 'On hold',
    shortName: 'HLD',
    state: 'blocked',
    icon: 'back_hand',
    color: '#fa6e46',
    scope: ['version', 'representation', 'task', 'workfile', 'product'],
    original_name: 'On hold',
  },
  Omitted: {
    name: 'Omitted',
    shortName: 'OMT',
    state: 'blocked',
    icon: 'block',
    color: '#cb1a1a',
    scope: ['product', 'version', 'representation', 'task', 'workfile'],
    original_name: 'Omitted',
  },
}

const StatusCell = ({ status }: { status: string }) => {
  const [showPlaceholder, setShowPlaceholder] = useState(true)
  const [value, setValue] = useState(status)
  const expandClickHandler = () => {
    setShowPlaceholder(false)
  }

  return (
    <DropdownColumnWrapper
      showPreview={showPlaceholder}
      handleExpandIconClick={expandClickHandler}
      previewValue={{
        icon: optionsMap[value].icon,
        color: optionsMap[value].color,
        text: value,
      }}
    >
      <StatusSelect
        value={[status]}
        options={options}
        onChange={(newValue) => {
          setValue(newValue)
          setShowPlaceholder(true)
        }}
      />
    </DropdownColumnWrapper>
  )
}

export default StatusCell
