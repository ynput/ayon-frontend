import DropdownColumnWrapper from './DropdownColumnWrapper'
import { $Any } from '@types'
import { useMemo, useState } from 'react'
import { EnumDropdown } from '@ynput/ayon-react-components'
import { StyledEnumDropdown } from './Cell.Styled'

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
    <StyledEnumDropdown
      onChange={(e) => {
        setValue(e[0])
        setShowPlaceholder(true)
      }}
      options={priorities}
      value={[priority]}
      placeholder=""
    />
  )

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
      <StyledEnumDropdown
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
