// Wraps the SubtasksManager remote component and provides it with required props from context and api
import {
  SubTaskNode,
  useGetUsersQuery,
  UserModel,
  useUpdateOverviewEntitiesMutation,
} from '@shared/api'
import { useSubtasksModulesContext } from '@shared/context'
import { useNavigate } from 'react-router-dom'

export type UpdateOverviewEntities = ReturnType<typeof useUpdateOverviewEntitiesMutation>[0]

export interface SubtasksManagerProps extends React.HTMLAttributes<HTMLDivElement> {
  subtasks: SubTaskNode[]
  projectName: string
  taskId: string
  selectedSubtaskIds?: string[]
  users: UserModel[]
  onClose?: () => void
  onSelectSubtasks?: (subtaskIds: string[]) => void
  updateOverviewEntities: UpdateOverviewEntities
  useNavigate: typeof useNavigate
}

export const SubtasksManagerWrapper = (
  props: Omit<SubtasksManagerProps, 'updateOverviewEntities' | 'users' | 'useNavigate'>,
) => {
  const { SubtasksManager } = useSubtasksModulesContext()
  const [updateOverviewEntities] = useUpdateOverviewEntitiesMutation()
  const { data: users = [] } = useGetUsersQuery({})

  return (
    <SubtasksManager
      {...props}
      updateOverviewEntities={updateOverviewEntities}
      users={users}
      useNavigate={useNavigate}
    />
  )
}
