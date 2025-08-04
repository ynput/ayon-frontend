import { FC } from 'react'
import { ViewFormData, ViewsContextValue, ViewSettings, ViewType } from '..'

export interface ViewFormDialogProps extends React.HTMLAttributes<HTMLDivElement> {
  editingView: Partial<ViewFormData> & { viewId?: string }
  setEditingView: (viewId: string | null) => void
  viewType: ViewType
  personalSettings?: ViewSettings
  projectName?: string
  setSelected: (viewId: string) => void
  onCreateView: ViewsContextValue['onCreateView']
  onDeleteView: ViewsContextValue['onDeleteView']
  api: ViewsContextValue['api']
  dispatch: any
}

const ViewFormDialogFallback: FC<ViewFormDialogProps> = () => null

export default ViewFormDialogFallback
