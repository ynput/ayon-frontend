import { FC } from 'react'
import { ViewFormData, ViewSettings, ViewType } from '..'

export interface ViewFormDialogProps extends React.HTMLAttributes<HTMLDivElement> {
  editingView: Partial<ViewFormData> & { viewId?: string }
  setEditingView: (viewId: string | null) => void
  viewType: ViewType
  personalSettings?: ViewSettings
  projectName?: string
  createView: any
  setSelected: (viewId: string) => void
  deleteView: any
}

const ViewFormDialogFallback: FC<ViewFormDialogProps> = () => null

export default ViewFormDialogFallback
