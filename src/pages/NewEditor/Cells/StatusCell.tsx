import DropdownCellWrapper from './DropdownCellWrapper'
import { StyledEnumDropdown } from './Cell.Styled'
import useDropdownPlaceholderState from '../hooks/useExplicitDropdownExpand'
const options = [
  {
    value: 'Not ready',
    label: 'Not ready',
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
    value: 'Ready to start',
    label: 'Ready to start',
    shortName: 'RDY',
    state: 'not_started',
    icon: 'timer',
    color: '#bababa',
    scope: ['product', 'version', 'representation', 'task', 'workfile'],
    original_name: 'Ready to start',
  },
  {
    name: 'In progress',
    value: 'In progress',
    label: 'In progress',
    shortName: 'PRG',
    state: 'in_progress',
    icon: 'play_arrow',
    color: '#3498db',
    scope: ['product', 'version', 'representation', 'task', 'workfile'],
    original_name: 'In progress',
  },
  {
    name: 'Pending review',
    value: 'Pending review',
    label: 'Pending review',
    shortName: 'RVW',
    state: 'in_progress',
    icon: 'visibility',
    color: '#ff9b0a',
    scope: ['product', 'version', 'representation', 'task', 'workfile'],
    original_name: 'Pending review',
  },
  {
    name: 'Approved',
    value: 'Approved',
    label: 'Approved',
    shortName: 'APP',
    state: 'done',
    icon: 'task_alt',
    color: '#00f0b4',
    scope: ['product', 'version', 'representation', 'task', 'workfile'],
    original_name: 'Approved',
  },
  {
    name: 'On hold',
    value: 'On hold',
    label: 'On hold',
    shortName: 'HLD',
    state: 'blocked',
    icon: 'back_hand',
    color: '#fa6e46',
    scope: ['version', 'representation', 'task', 'workfile', 'product'],
    original_name: 'On hold',
  },
  {
    name: 'Omitted',
    value: 'Omitted',
    label: 'Omitted',
    shortName: 'OMT',
    state: 'blocked',
    icon: 'block',
    color: '#cb1a1a',
    scope: ['product', 'version', 'representation', 'task', 'workfile'],
    original_name: 'Omitted',
  },
]

const optionsMap = {
  'Not ready': {
    label: 'Not ready',
    value: 'Not ready',
    name: 'Not ready',
    shortName: 'NRD',
    state: 'not_started',
    icon: 'fiber_new',
    color: '#434a56',
    scope: ['product', 'version', 'representation', 'task', 'workfile'],
    original_name: 'Not ready',
  },
  'Not Ready': {
    label: 'Not ready',
    value: 'Not ready',
    name: 'Not ready',
    shortName: 'NRD',
    state: 'not_started',
    icon: 'fiber_new',
    color: '#434a56',
    scope: ['product', 'version', 'representation', 'task', 'workfile'],
    original_name: 'Not ready',
  },
  'Ready to start': {
    label: 'Ready to start',
    value: 'Ready to start',
    name: 'Ready to start',
    shortName: 'RDY',
    state: 'not_started',
    icon: 'timer',
    color: '#bababa',
    scope: ['product', 'version', 'representation', 'task', 'workfile'],
    original_name: 'Ready to start',
  },
  'In progress': {
    label: 'In progress',
    value: 'In progress',
    name: 'In progress',
    shortName: 'PRG',
    state: 'in_progress',
    icon: 'play_arrow',
    color: '#3498db',
    scope: ['product', 'version', 'representation', 'task', 'workfile'],
    original_name: 'In progress',
  },
  'Pending review': {
    label: 'Pending review',
    value: 'Pending review',
    name: 'Pending review',
    shortName: 'RVW',
    state: 'in_progress',
    icon: 'visibility',
    color: '#ff9b0a',
    scope: ['product', 'version', 'representation', 'task', 'workfile'],
    original_name: 'Pending review',
  },
  Approved: {
    label: 'Approved',
    value: 'Approved',
    name: 'Approved',
    shortName: 'APP',
    state: 'done',
    icon: 'task_alt',
    color: '#00f0b4',
    scope: ['product', 'version', 'representation', 'task', 'workfile'],
    original_name: 'Approved',
  },
  'On hold': {
    label: 'On hold',
    value: 'On hold',
    name: 'On hold',
    shortName: 'HLD',
    state: 'blocked',
    icon: 'back_hand',
    color: '#fa6e46',
    scope: ['version', 'representation', 'task', 'workfile', 'product'],
    original_name: 'On hold',
  },
  Omitted: {
    label: 'Omitted',
    value: 'Omitted',
    name: 'Omitted',
    shortName: 'OMT',
    state: 'blocked',
    icon: 'block',
    color: '#cb1a1a',
    scope: ['product', 'version', 'representation', 'task', 'workfile'],
    original_name: 'Omitted',
  },
}
type Props = {
  status: string
  updateHandler: (newValue: string) => void
}

const StatusCell = ({ status, updateHandler }: Props) => {
  const { showPlaceholder, setShowPlaceholder, value, expandClickHandler, changeHandler, ref } =
    useDropdownPlaceholderState(status, updateHandler)

  const dropdownComponent = (
    <StyledEnumDropdown
      ref={ref}
      onChange={(e) => {
        changeHandler(e[0])
      }}
      onClose={() => setShowPlaceholder(true)}
      options={options}
      value={[value]}
    />
  )

  return showPlaceholder ? (
    <DropdownCellWrapper
      showPreview={showPlaceholder}
      handleExpandIconClick={expandClickHandler}
      previewValue={{
        icon: optionsMap[value].icon,
        color: optionsMap[value].color,
        text: optionsMap[value].label,
      }}
    >
      {dropdownComponent}
    </DropdownCellWrapper>
  ) : (
    dropdownComponent
  )
}

export default StatusCell
