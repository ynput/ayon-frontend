import { FC } from 'react'
import { ViewFormData, ViewsContextValue, ViewSettings, ViewType } from '..'
import { ShareOption, UserModel } from '@shared/api'

export interface ViewFormDialogProps {
  editingView: Partial<ViewFormData> & { viewId?: string }
  setEditingView: (viewId: string | null) => void
  viewType: ViewType
  viewSettings?: ViewSettings
  currentUser?: UserModel
  projectName?: string
  setSelected: (viewId: string) => void
  // data
  shareOptions?: ShareOption[]
  // data mutations
  onCreateView: ViewsContextValue['onCreateView']
  onUpdateView: ViewsContextValue['onUpdateView']
  onDeleteView: ViewsContextValue['onDeleteView']
  api: ViewsContextValue['api']
  dispatch: any
  pt?: {
    dialog?: Partial<React.HTMLAttributes<HTMLDivElement>>
  }
}

const ViewFormDialogFallback: FC<ViewFormDialogProps> = () => null

export default ViewFormDialogFallback
