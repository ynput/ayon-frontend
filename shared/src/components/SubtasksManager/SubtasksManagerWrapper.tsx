// Wraps the SubtasksManager remote component and provides it with required props from context and api
import { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import api, {
  productsListTag,
  QueryFilter,
  SubTaskNode,
  useGetUsersAssigneeQuery,
  UserModel,
  useUpdateSubtasksMutation,
} from '@shared/api'
import { ProjectContextValue, useProjectContext } from '@shared/context'
import { useNavigate } from 'react-router-dom'

type UpdateSubtasksMutation = ReturnType<typeof useUpdateSubtasksMutation>[0]

export type EntityLinkChange = {
  action: 'created' | 'removed'
  linkId?: string
  linkType: string
  input: string
  output?: string
  outputType?: string
  inputType?: string
  data?: Record<string, unknown>
}

export interface SubtasksManagerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  subtasks: SubTaskNode[]
  projectName: string
  taskId: string
  taskName: string
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
  onLink?: (change: EntityLinkChange) => void
  onNotFound?: () => void // when remote module is not found
  dispatch?: ThunkDispatch<any, any, UnknownAction>
}

export type SubtasksManagerWrapperProps = Omit<
  SubtasksManagerProps,
  'updateSubtasks' | 'users' | 'projectContext'
> & {
  SubtasksManager: React.ComponentType<SubtasksManagerProps>
}

export const SubtasksManagerWrapper = ({
  SubtasksManager,
  dispatch,
  ...props
}: SubtasksManagerWrapperProps) => {
  const [updateSubtasks] = useUpdateSubtasksMutation()
  const { data: users = [] } = useGetUsersAssigneeQuery({ projectName: props.projectName })
  const projectContext = useProjectContext()

  // handle product link changes so we can invalidate the products cache
  const handleProductLinkChange = (change: EntityLinkChange) => {
    if (change.outputType === 'product') {
      dispatch?.(
        api.util.invalidateTags([
          productsListTag,
          { type: 'productColumnStats', id: props.projectName },
          { type: 'link', id: change.output },
          { type: 'link', id: change.input },
          { type: 'link', id: change.linkId },
        ]),
      )
    }
    // continue handling other link changes if necessary
    props.onLink?.(change)
  }

  return (
    <SubtasksManager
      {...props}
      updateSubtasks={updateSubtasks}
      users={users}
      projectContext={projectContext}
      onLink={handleProductLinkChange}
    />
  )
}
