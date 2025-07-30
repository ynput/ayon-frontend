import { FC } from 'react'
import { ViewType } from '.'
import { ViewsProvider } from './context/ViewsContext'
import { ViewsButton } from './ViewsButton/ViewsButton'
import { ViewsMenuContainer } from './ViewsMenuContainer/ViewsMenuContainer'

export interface ViewsProps {
  viewType: ViewType
  projectName?: string
}

export const Views: FC<ViewsProps> = ({ viewType, projectName }) => {
  return (
    <ViewsProvider viewType={viewType} projectName={projectName}>
      <ViewsButton />
      <ViewsMenuContainer />
    </ViewsProvider>
  )
}

// Component for use inside a ViewsProvider
export const ViewsComponents: FC = () => {
  return (
    <>
      <ViewsButton />
      <ViewsMenuContainer />
    </>
  )
}
