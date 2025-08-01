import { FC } from 'react'
import { ViewFormData, ViewType } from '..'

export interface ViewFormDialogProps extends React.HTMLAttributes<HTMLDivElement> {
  editingView: Partial<ViewFormData> & { viewId?: string }
  setEditingView: (viewId: string | null) => void
  viewType: ViewType
  projectName?: string
  createView: any
  deleteView: any
}

const ViewFormDialogFallback: FC<ViewFormDialogProps> = () => null

export default ViewFormDialogFallback
