import DropdownColumnWrapper from './DropdownColumnWrapper'
import { $Any } from '@types'
import { PriorityEnumDropdown } from '@components/ListItem/ListItem.styled'

const PriorityCell = ({ priority, priorities }: { priority: string; priorities: $Any }) => {
  const priorityData = priorities.find((el: $Any) => el.value === priority)
  return (
    <DropdownColumnWrapper
      showPreview
      previewValue={{
        icon: priorityData.icon,
        color: priorityData.color,
        text: priority,
      }}
    >
      <PriorityEnumDropdown
        options={priorities}
        value={['high']}
        placeholder=""
        style={{ width: 'max-content' }}
      />
    </DropdownColumnWrapper>
  )
}

export default PriorityCell
