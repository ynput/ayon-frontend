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
export * from './hooks/useTaskProgressViewSettings'
export * from './hooks/useOverviewViewSettings'
export * from './utils/generateWorkingView'

// Re-export the ViewsComponents for convenience
export { Views } from './Views'

// Re-export constants
export { WORKING_VIEW_ID, NEW_VIEW_ID } from './ViewsMenuContainer/ViewsMenuContainer'

// types
export type ViewFormData = Required<
  Pick<ViewListItemModel, 'label' | 'scope' | 'visibility' | 'owner' | 'access'>
>
export type ViewType = 'overview' | 'taskProgress'
