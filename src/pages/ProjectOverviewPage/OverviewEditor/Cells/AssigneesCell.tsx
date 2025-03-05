import useDropdownPlaceholderState from '../hooks/useExplicitDropdownExpand'
import { AssigneeSelect } from '@ynput/ayon-react-components'
import { UserNode } from '@api/graphql'
import AssigneesCellWrapper from './AssigneesCellWrapper'

type Props = {
  assignees: string[]
  allUsers: UserNode[]
  updateHandler: (newValue: string[]) => void
}
const AssigneesCell = ({ assignees, allUsers, updateHandler }: Props) => {
  const { showPlaceholder, setShowPlaceholder, value, expandClickHandler, changeHandler, ref } =
    useDropdownPlaceholderState(assignees, updateHandler)

  const activeComponent = (
    <AssigneeSelect
      ref={ref}
      onChange={changeHandler}
      onClose={() => setShowPlaceholder(true)}
      options={allUsers}
      value={value}
    />
  )

  return showPlaceholder ? (
    <AssigneesCellWrapper
      assignees={value}
      allUsers={allUsers}
      showPreview={showPlaceholder}
      handleExpandIconClick={expandClickHandler}
    >
      {activeComponent}
    </AssigneesCellWrapper>
  ) : (
    activeComponent
  )
}

export default AssigneesCell
