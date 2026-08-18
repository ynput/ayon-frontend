// Wraps the SubtasksManager remote component and provides it with required props from context and api
import {
  QueryFilter,
  SubTaskNode,
  useGetUsersAssigneeQuery,
  UserModel,
  useUpdateSubtasksMutation,
} from '@shared/api'
import { ProjectContextValue, useProjectContext } from '@shared/context'
import { useNavigate } from 'react-router-dom'

type UpdateSubtasksMutation = ReturnType<typeof useUpdateSubtasksMutation>[0]

export interface SubtasksManagerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  subtasks: SubTaskNode[]
  projectName: string
  taskId: string
  folderId?: string // used for creating products
  selectedSubtaskIds?: string[]
  users: UserModel[]
  title?: string | null
  filters?: QueryFilter
  actionsPortalClassName?: string
  projectContext: ProjectContextValue
  onClose?: () => void
  onSelectSubtasks?: (subtaskIds: string[]) => void
  updateSubtasks: UpdateSubtasksMutation
  useNavigate: typeof useNavigate
  onNotFound?: () => void // when remote module is not found
}

export type SubtasksManagerWrapperProps = Omit<SubtasksManagerProps, 'updateSubtasks' | 'users'> & {
  SubtasksManager: React.ComponentType<SubtasksManagerProps>
}

export const SubtasksManagerWrapper = ({
  SubtasksManager,
  ...props
}: SubtasksManagerWrapperProps) => {
  const [updateSubtasks] = useUpdateSubtasksMutation()
  const { data: users = [] } = useGetUsersAssigneeQuery({ projectName: props.projectName })
  const projectContext = useProjectContext()

  return (
    <SubtasksManager
      {...props}
      updateSubtasks={updateSubtasks}
      users={users}
      onNotFound={props.onNotFound}
      projectContext={projectContext}
    />
  )
}
