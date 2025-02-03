import DropdownCellWrapper from './DropdownCellWrapper'
import { StyledEnumDropdown } from './Cell.Styled'
import useDropdownPlaceholderState from '../hooks/useExplicitDropdownExpand'
import { Status } from '@api/rest/project'

type Props = {
  status: string
  statuses: Status[]
  updateHandler: (newValue: string[]) => void
}

const StatusCell = ({ status, statuses, updateHandler }: Props) => {
  const dropdownMappings = statuses.map(el => ({...el, value: el.name, label: el.name}))
  const mappedStatuses = dropdownMappings.reduce((acc: Map<string, Status>, el: Status) => {
    acc.set(el.name, el)
    return acc
  }, new Map())

  const { showPlaceholder, setShowPlaceholder, value, expandClickHandler, changeHandler, ref } =
    useDropdownPlaceholderState([status], updateHandler)

  const dropdownComponent = (
    <StyledEnumDropdown
      ref={ref}
      onChange={(e) => {
        changeHandler([e[0]])
      }}
      onClose={() => setShowPlaceholder(true)}
      options={dropdownMappings}
      value={value}
    />
  )

  const matchingStatus = mappedStatuses.get(value[0])

  return showPlaceholder ? (
    <DropdownCellWrapper
      showPreview={showPlaceholder}
      handleExpandIconClick={expandClickHandler}
      previewValue={{
        icon: matchingStatus.icon,
        color: matchingStatus.color,
        text: matchingStatus.label,
      }}
    >
      {dropdownComponent}
    </DropdownCellWrapper>
  ) : (
    dropdownComponent
  )
}

export default StatusCell
