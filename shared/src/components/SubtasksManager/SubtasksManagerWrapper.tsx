// Wraps the SubtasksManager remote component and provides it with required props from context and api
import {
  QueryFilter,
  SubTaskNode,
  useGetUsersQuery,
  UserModel,
  useUpdateSubtasksMutation,
} from '@shared/api'
import { useNavigate } from 'react-router-dom'

type UpdateSubtasksMutation = ReturnType<typeof useUpdateSubtasksMutation>[0]

export interface SubtasksManagerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  subtasks: SubTaskNode[]
  projectName: string
  taskId: string
  selectedSubtaskIds?: string[]
  users: UserModel[]
  title?: string | null
  filters?: QueryFilter
  actionsPortalClassName?: string
  onClose?: () => void
  onSelectSubtasks?: (subtaskIds: string[]) => void
  updateSubtasks: UpdateSubtasksMutation
  useNavigate: typeof useNavigate
}

export type SubtasksManagerWrapperProps = Omit<
  SubtasksManagerProps,
  'updateSubtasks' | 'users' | 'useNavigate'
> & {
  SubtasksManager: React.ComponentType<SubtasksManagerProps>
}

export const SubtasksManagerWrapper = ({
  SubtasksManager,
  ...props
}: SubtasksManagerWrapperProps) => {
  const [updateSubtasks] = useUpdateSubtasksMutation()
  const { data: users = [] } = useGetUsersQuery({})

  return (
    <SubtasksManager
      {...props}
      updateSubtasks={updateSubtasks}
      users={users}
      useNavigate={useNavigate}
    />
  )
}
