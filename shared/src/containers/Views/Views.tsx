import { FC } from 'react'
import { ViewsButton } from './ViewsButton/ViewsButton'
import { ViewsMenuContainer } from './ViewsMenuContainer/ViewsMenuContainer'
import ViewsDialogContainer from './ViewsDialogContainer/ViewsDialogContainer'

// Component for use inside a ViewsProvider
export const Views: FC = () => {
  return (
    <>
      <ViewsButton />
      <ViewsMenuContainer />
      <ViewsDialogContainer />
    </>
  )
}
