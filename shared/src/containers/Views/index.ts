import { ViewListItemModel } from '@shared/api'

export * from './Views'
export * from './context/ViewsContext'
export * from './ViewsButton/ViewsButton'
export * from './ViewsMenuContainer/ViewsMenuContainer'
export * from './utils/portalUtils'
export * from './utils/getCustomViewsFallback'
export * from './ViewsDialogContainer/ViewFormDialogFallback'

// Re-export the ViewsComponents for convenience
export { Views } from './Views'

// Re-export constants
export { PERSONAL_VIEW_ID, NEW_VIEW_ID } from './ViewsMenuContainer/ViewsMenuContainer'

// types
export type ViewFormData = Required<Pick<ViewListItemModel, 'label' | 'scope' | 'visibility'>>
export type ViewType = 'overview' | 'taskProgress'
