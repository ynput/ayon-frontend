import useExplicitDropdownExpand from '../hooks/useExplicitDropdownExpand'
import { StyledEnumDropdown } from './Cell.Styled'
import DropdownColumnWrapper from './DropdownColumnWrapper'
import { $Any } from '@types'

type Props = {
  taskTypes: $Any
  type: string
}

const TaskTypeCell: React.FC<Props> = ({ taskTypes, type }) => {

  const mappedTypes = Object.values(taskTypes).map((el: $Any) => ({
    value: el.name,
    label: el.name,
    icon: el.icon,
  }))

  const {
    showPlaceholder,
    setShowPlaceholder,
    value,
    expandClickHandler,
    changeHandler,
    ref,
  } = useExplicitDropdownExpand(type, () => {})

  const dropdownComponent = (
    <StyledEnumDropdown
      ref={ref}
      onChange={(e) => changeHandler(e[0])}
      onClose={() => setShowPlaceholder(true)}
      options={mappedTypes}
      value={[value]}
      placeholder=""
    />
  )

  return 'foo?'
  return (
    <DropdownColumnWrapper
      showPreview={showPlaceholder}
      handleExpandIconClick={expandClickHandler}
      previewValue={{
        icon: taskTypes[value].icon,
        color: '',
        text: value,
      }}
    >
      {dropdownComponent}
    </DropdownColumnWrapper>
  )
}

export default TaskTypeCell
