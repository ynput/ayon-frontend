import { GetViewApiResponse } from '@shared/api'
import { AccessLevel } from '@shared/components'

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
export * from './utils/viewUpdateHelper'

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
  Pick<GetViewApiResponse, 'label' | 'scope' | 'visibility' | 'owner' | 'accessLevel'> & {
    access: Record<string, AccessLevel>
  }
>

export const viewTypes = [
  'overview',
  'taskProgress',
  'versions',
  'lists',
  'reviews',
  'reports',
] as const
export type ViewType = (typeof viewTypes)[number] | string
