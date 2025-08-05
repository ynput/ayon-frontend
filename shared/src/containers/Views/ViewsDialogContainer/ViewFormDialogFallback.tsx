import { FC } from 'react'
import { ViewFormData, ViewsContextValue, ViewSettings, ViewType } from '..'
import { UserModel } from '@shared/api'

export interface ViewFormDialogProps {
  editingView: Partial<ViewFormData> & { viewId?: string }
  setEditingView: (viewId: string | null) => void
  viewType: ViewType
  personalSettings?: ViewSettings
  currentUser?: UserModel
  projectName?: string
  setSelected: (viewId: string) => void
  onCreateView: ViewsContextValue['onCreateView']
  onDeleteView: ViewsContextValue['onDeleteView']
  api: ViewsContextValue['api']
  dispatch: any
  pt?: {
    dialog?: Partial<React.HTMLAttributes<HTMLDivElement>>
  }
}

const ViewFormDialogFallback: FC<ViewFormDialogProps> = () => null

export default ViewFormDialogFallback
