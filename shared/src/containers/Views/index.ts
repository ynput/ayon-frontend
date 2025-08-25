import { ViewListItemModel } from '@shared/api'

export * from './Views'
export * from './context/ViewsContext'
export * from './ViewsButton/ViewsButton'
export * from './ViewsMenuContainer/ViewsMenuContainer'
export * from './utils/portalUtils'
export * from './utils/getCustomViewsFallback'
export * from './ViewsDialogContainer/ViewFormDialogFallback'
export * from './ViewsMenu/ViewsMenu'
export * from './ViewsMenuContainer/ViewsMenuContainer'
export * from './utils/generateWorkingView'

// hooks
export * from './hooks'

// page sync hooks
export * from './hooks/pages/useTaskProgressViewSettings'
export * from './hooks/pages/useOverviewViewSettings'
export * from './hooks/pages/useListsViewSettings'

// Re-export the ViewsComponents for convenience
export { Views } from './Views'

// Re-export constants
export { WORKING_VIEW_ID, NEW_VIEW_ID } from './ViewsMenuContainer/ViewsMenuContainer'

// types
export type ViewFormData = Required<
  Pick<ViewListItemModel, 'label' | 'scope' | 'visibility' | 'owner' | 'access' | 'accessLevel'>
>

export const viewTypes = ['overview', 'taskProgress', 'lists', 'reviews'] as const
export type ViewType = (typeof viewTypes)[number]
