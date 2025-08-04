import { ViewMenuItem } from '../ViewsMenu/ViewsMenu'
import { ViewListItemModelExtended } from '../hooks/useBuildViewMenuItems'

export type GetAllViewsProps = {
  viewsList: ViewListItemModelExtended[]
  onEdit: (viewId: string) => void
  onSelect: (viewId: string) => void
}

export type GetAllViewsReturn = {
  myViews: ViewMenuItem[]
  sharedViews: ViewMenuItem[]
}

export const getCustomViewsFallback = (props: GetAllViewsProps): GetAllViewsReturn => ({
  myViews: [],
  sharedViews: [],
})
