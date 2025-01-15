import DropdownColumnWrapper from './DropdownColumnWrapper'
import { $Any } from '@types'
import { PriorityEnumDropdown } from '@components/ListItem/ListItem.styled'
import { useMemo, useState } from 'react'

type Props = {
  priority: string
  priorities: $Any
}
const PriorityCell = ({ priority, priorities }: Props) => {
  const [showPlaceholder, setShowPlaceholder] = useState(true)
  const [value, setValue] = useState(priority)

  const expandClickHandler = () => {
    setShowPlaceholder(false)
  }

  const priorityData = useMemo(() => {
    return priorities.find((el: $Any) => el.value === value)
  }, [value])

  return (
    <DropdownColumnWrapper
      showPreview={showPlaceholder}
      handleExpandIconClick={expandClickHandler}
      previewValue={{
        icon: priorityData.icon,
        color: priorityData.color,
        text: priorityData.value,
      }}
    >
      <PriorityEnumDropdown
        onChange={(e) => {
          setValue(e[0])
          setShowPlaceholder(true)
        }}
        options={priorities}
        value={['high']}
        placeholder=""
        style={{ width: 'max-content' }}
      />
    </DropdownColumnWrapper>
  )
}

export default PriorityCell
