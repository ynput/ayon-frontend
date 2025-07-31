import { FC } from 'react'
import { ViewType } from '..'

export interface ViewFormDialogProps extends React.HTMLAttributes<HTMLDivElement> {
  editingView: { viewId?: string } | null
  setEditingView: (view: { viewId: string | undefined }) => void
  viewType: ViewType
  projectName?: string
}

const ViewFormDialogFallback: FC<ViewFormDialogProps> = () => null

export default ViewFormDialogFallback
