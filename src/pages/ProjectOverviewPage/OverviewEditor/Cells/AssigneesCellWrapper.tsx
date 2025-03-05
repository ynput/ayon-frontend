import { PropsWithChildren } from 'react';
import AssigneessCellContent from './AssigneesCellContent';
import { UserNode } from '@api/graphql';
type Props = {
  assignees: string[]
  allUsers: UserNode[]
  showPreview: boolean
  handleExpandIconClick: () => void
}

const AssigneesCellWrapper: React.FC<HTMLDivElement & PropsWithChildren<Props>> = ({
  assignees,
  allUsers,
  showPreview,
  handleExpandIconClick,
  children,
}) => {
  if (showPreview) {
    return (
      <AssigneessCellContent
        assignees={assignees}
        allUsers={allUsers}
        handleExpandIconClick={handleExpandIconClick}
      />
    )
  }

  return children
}

export default AssigneesCellWrapper
