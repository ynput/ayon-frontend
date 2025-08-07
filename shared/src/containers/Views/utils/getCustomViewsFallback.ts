import { ViewMenuItem } from '../ViewsMenu/ViewsMenu'
import { ViewListItemModelExtended } from '../hooks/useBuildViewMenuItems'

export type GetCustomViews = {
  viewsList: ViewListItemModelExtended[]
  onEdit: (viewId: string) => void
  onSelect: (viewId: string) => void
  onSave: (viewId: string) => void
}

export type CustomViews = {
  myViews: ViewMenuItem[]
  sharedViews: ViewMenuItem[]
}

export const getCustomViewsFallback = (props: GetCustomViews): CustomViews => ({
  myViews: [],
  sharedViews: [],
})
