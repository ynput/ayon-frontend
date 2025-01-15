import { useState } from 'react'
import DropdownColumnWrapper from './DropdownColumnWrapper'
import { $Any } from '@types'
import { EnumDropdown } from '@ynput/ayon-react-components'

type Props = {
  folderTypes: $Any
  type: string
}

const FolderTypeCell: React.FC<Props> = ({ folderTypes, type }) => {
  const [showPlaceholder, setShowPlaceholder] = useState(true)
  const [value, setValue] = useState(type)
  const mappedTypes = Object.values(folderTypes).map((el: $Any) => ({
    value: el.name,
    label: el.name,
    icon: el.icon,
  }))

  const expandClickHandler = () => {
    setShowPlaceholder(false)
  }


  return (
    <DropdownColumnWrapper
      showPreview={showPlaceholder}
      handleExpandIconClick={expandClickHandler}
      previewValue={{
        icon: folderTypes[value].icon,
        color: '',
        text: value,
      }}
    >
      <EnumDropdown
        onChange={(e) => {
          setShowPlaceholder(true)
          setValue(e[0])
        }}
        options={mappedTypes}
        value={['high']}
        placeholder=""
        style={{ width: 'max-content' }}
      />
    </DropdownColumnWrapper>
  )
}

export default FolderTypeCell
