// hoc to wrap components with views context
import { FC } from 'react'
import { ViewsProvider } from '../../shared/src/containers/Views/context/ViewsContext'
import { Views } from '../../shared/src/containers/Views/Views'
import { useAppDispatch } from '@state/store'

interface WithViewsProps {
  children: React.ReactNode
  viewType?: string
  projectName?: string
}

export const WithViews: FC<WithViewsProps> = ({ children, viewType, projectName }) => {
  const dispatch = useAppDispatch()
  return (
    <ViewsProvider viewType={viewType} projectName={projectName} dispatch={dispatch}>
      <Views />
      {children}
    </ViewsProvider>
  )
}
