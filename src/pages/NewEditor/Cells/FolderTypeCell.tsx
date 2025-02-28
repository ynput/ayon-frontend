import DropdownCellWrapper from './DropdownCellWrapper'
import { $Any } from '@types'
import { StyledEnumDropdown } from './Cell.Styled'
import useDropdownPlaceholderState from '../hooks/useExplicitDropdownExpand'

type Props = {
  folderTypes: $Any
  type: string
  updateHandler: (newValue: string) => void
}

const FolderTypeCell: React.FC<Props> = ({ folderTypes, type, updateHandler }) => {
  const { showPlaceholder, setShowPlaceholder, value, expandClickHandler, changeHandler, ref } =
    useDropdownPlaceholderState([type], updateHandler)

  const mappedTypes = Object.values(folderTypes).map((el: $Any) => ({
    value: el.name,
    label: el.name,
    icon: el.icon,
  }))

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

export default FolderTypeCell
