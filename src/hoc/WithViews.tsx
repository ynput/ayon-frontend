// hoc to wrap components with views context
import { FC } from 'react'
import { ViewsProvider } from '../../shared/src/containers/Views/context/ViewsContext'
import { Views } from '../../shared/src/containers/Views/Views'
import { useAppDispatch } from '@state/store'
import { useIsMobile } from '@hooks/useIsMobile'
import MobileViews from '@containers/MobileShell/MobileViews'

interface WithViewsProps {
  children: React.ReactNode
  viewType?: string
  projectName?: string
}

export const WithViews: FC<WithViewsProps> = ({ children, viewType, projectName }) => {
  const dispatch = useAppDispatch()
  const isMobile = useIsMobile()
  return (
    <ViewsProvider viewType={viewType} projectName={projectName} dispatch={dispatch}>
      {isMobile ? <MobileViews /> : <Views />}
      {children}
    </ViewsProvider>
  )
}
