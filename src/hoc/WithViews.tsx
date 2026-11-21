// hoc to wrap components with views context
import { FC } from 'react'
import { ViewsProvider } from '../../shared/src/containers/Views/context/ViewsContext'
import { Views } from '../../shared/src/containers/Views/Views'
import { useAppDispatch } from '@state/store'
import { useViewPresets } from './useViewPresets'

interface WithViewsProps {
  children: React.ReactNode
  viewType?: string
  projectName?: string
}

export const WithViews: FC<WithViewsProps> = ({ children, viewType, projectName }) => {
  const dispatch = useAppDispatch()
  const presets = useViewPresets(viewType)
  return (
    <ViewsProvider
      viewType={viewType}
      projectName={projectName}
      dispatch={dispatch}
      presets={presets}
    >
      <Views />
      {children}
    </ViewsProvider>
  )
}
