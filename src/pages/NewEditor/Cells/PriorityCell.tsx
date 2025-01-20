import DropdownColumnWrapper from './DropdownColumnWrapper'
import { $Any } from '@types'
import { useMemo } from 'react'
import { StyledEnumDropdown } from './Cell.Styled'
import useDropdownPlaceholderState from '../hooks/useExplicitDropdownExpand'

type Props = {
  priority: string
  priorities: $Any
  updateHandler: (newValue: string) => void
}
const PriorityCell = ({ priority, priorities, updateHandler }: Props) => {
  const {
    showPlaceholder,
    setShowPlaceholder,
    value,
    expandClickHandler,
    changeHandler,
    ref,
  } = useDropdownPlaceholderState(priority, updateHandler)

  const priorityData = useMemo(() => {
    return priorities.find((el: $Any) => el.value === value)
  }, [value])

  const dropdownComponent = (
    <StyledEnumDropdown
      ref={ref}
      onChange={(e) => {
        changeHandler(e[0])
      }}
      onClose={() => setShowPlaceholder(true)}
      options={priorities}
      value={[priority]}
    />
  )

  return showPlaceholder ? (
    <DropdownColumnWrapper
      showPreview={showPlaceholder}
      handleExpandIconClick={expandClickHandler}
      previewValue={{
        icon: priorityData.icon,
        color: priorityData.color,
        text: priorityData.label,
      }}
    >
      {dropdownComponent}
    </DropdownColumnWrapper>
  ) : (
    dropdownComponent
  )
}

export default PriorityCell
