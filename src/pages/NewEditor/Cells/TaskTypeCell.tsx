import useDropdownPlaceholderState from '../hooks/useExplicitDropdownExpand'
import { StyledEnumDropdown } from './Cell.Styled'
import DropdownCellWrapper from './DropdownCellWrapper'
import { $Any } from '@types'

type Props = {
  taskTypes: $Any
  type: string
  updateHandler: (newValue: string) => void
}

const TaskTypeCell: React.FC<Props> = ({ taskTypes, type, updateHandler }) => {
  const mappedTypes = Object.values(taskTypes).map((el: $Any) => ({
    value: el.name,
    label: el.name,
    icon: el.icon,
  }))

  const { showPlaceholder, setShowPlaceholder, value, expandClickHandler, changeHandler, ref } =
    useDropdownPlaceholderState(type, updateHandler)

  const dropdownComponent = (
    <StyledEnumDropdown
      ref={ref}
      onChange={(e) => changeHandler(e[0])}
      onClose={() => setShowPlaceholder(true)}
      options={mappedTypes}
      value={[value]}
    />
  )

  return (
    <DropdownCellWrapper
      showPreview={showPlaceholder}
      handleExpandIconClick={expandClickHandler}
      previewValue={{
        color: '',
        text: value,
      }}
    >
      {dropdownComponent}
    </DropdownCellWrapper>
  )
}

export default TaskTypeCell
