import { ViewItem } from '../ViewItem/ViewItem'
import { ViewListItemModelExtended } from '../hooks/useBuildViewMenuItems'

export type GetCustomViews = {
  viewsList: ViewListItemModelExtended[]
  onEdit: (viewId: string) => void
  onSelect: (viewId: string) => void
  onSave: (viewId: string) => void
}

export type CustomViews = {
  myViews: ViewItem[] // views current user has created but are private
  sharedViews: ViewItem[] // public views I have shared or are shared with me
  allPrivateViews: ViewItem[] // ADMIN ONLY: views that are private and current user is not the owner
}

export const getCustomViewsFallback = (props: GetCustomViews): CustomViews => ({
  myViews: [],
  sharedViews: [],
  allPrivateViews: [],
})
