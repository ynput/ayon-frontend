import type { ViewListItemModel } from '@shared/api'

export const isViewStudioScope = (
  viewId: string | undefined,
  viewsList: ViewListItemModel[],
) => {
  if (!viewId) return true
  const view = viewsList.find((v) => v.id === viewId)
  return view?.scope === 'studio'
}