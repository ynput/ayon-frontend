import { ViewListItemModel } from '@shared/api'
import { ViewMenuItem } from '../ViewsMenu/ViewsMenu'

export type GetAllViewsProps = {
  viewsList: ViewListItemModel[]
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
