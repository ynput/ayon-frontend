import { AttributeEnumItem, ProjectModel } from '@shared/api'
import { FC } from 'react'

export interface RelatedTasksFallbackProps {
  isPanelOpen: boolean
  projectsInfo?: Record<string, ProjectModel>
  priorities?: AttributeEnumItem[]
  taskData: { id: string; taskType: string; projectName: string }
  selectedTasks?: string[]
  onSelectTasks: (tasks: { id: string; taskType: string }[], projectName: string) => void
  onOpenViewer: (taskId: string, projectName: string) => void
  viewerOpen?: boolean
}

export const RelatedTasksFallback: FC<RelatedTasksFallbackProps> = ({}) => {
  return null
}
