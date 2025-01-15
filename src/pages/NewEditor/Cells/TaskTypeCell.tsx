import DropdownColumnWrapper from './DropdownColumnWrapper'
import { $Any } from '@types'

type Props = {
  taskTypes: $Any
  type: string
}

const TaskTypeCell: React.FC<Props> = ({ taskTypes, type }) => {
  const icon = taskTypes[type].icon
  return (
    <DropdownColumnWrapper
      showPreview
      previewValue={{
        icon: icon,
        color: '',
        text: type,
      }}
    >
      ...
    </DropdownColumnWrapper>
  )
}

export default TaskTypeCell
