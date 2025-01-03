import { Icon, StatusSelect } from '@ynput/ayon-react-components'
import { memo } from 'react'
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

const StatusColumn = ({ status }: { status: string }) => {
  var color = '#3498db'
  return <StatusSelect value={[status]} options={options} />
  return (
    <div style={{ display: 'flex' }}>
      <Icon icon="play_arrow" style={{ color }} />
      <span style={{ color }}>In progress</span>
    </div>
  )
}

export default StatusColumn
