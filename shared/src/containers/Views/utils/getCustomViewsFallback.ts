import { ViewItem } from '../ViewItem/ViewItem'
import { ViewListItemModelExtended, BASE_VIEW_ID } from '../hooks/useBuildViewMenuItems'

export type GetCustomViews = {
  viewsList: ViewListItemModelExtended[]
  onEdit: (viewId: string) => void
  onSelect: (viewId: string) => void
  onSave: (viewId: string) => void
  onMakeDefaultView?: (viewId: string) => (e: React.MouseEvent<HTMLButtonElement>) => Promise<void>
}

export type CustomViews = {
  myViews: ViewItem[] // views current user has created but are private
  sharedViews: ViewItem[] // public views I have shared or are shared with me
  allPrivateViews: ViewItem[] // ADMIN ONLY: views that are private and current user is not the owner
}

export const getCustomViewsFallback = (props: GetCustomViews): CustomViews => {
  const { viewsList, onEdit, onSelect, onSave, onMakeDefaultView } = props

  const existingBaseView = viewsList.find((view) => view.label === BASE_VIEW_ID)
  const makeDefaultTooltip = existingBaseView ? 'Update base view' : 'Create base view'

  // Helper to create view items with common properties
  const createViewItem = (
    view: ViewListItemModelExtended,
    overrides: Partial<ViewItem> = {},
  ): ViewItem => ({
    id: view.id as string,
    label: view.label,
    isSelected: false,
    highlighted: view.highlighted,
    onClick: () => onSelect(view.id as string),
    onMakeDefaultView: onMakeDefaultView?.(view.id as string),
    makeDefaultTooltip,
    ...overrides,
  })

  // My Views: private views owned by current user (editable)
  const myViews = viewsList
    .filter((view) => view.visibility === 'private' && view.isOwner && !view.working)
    .map((view) =>
      createViewItem(view, {
        isEditable: true,
        isSaveable: true,
        onEdit: () => onEdit(view.id as string),
        onSave: () => onSave(view.id as string),
      }),
    )

  // Shared Views: public views (editable only if owned)
  const sharedViews = viewsList
    .filter((view) => view.visibility === 'public' && !view.working)
    .map((view) =>
      createViewItem(view, {
        isEditable: view.isOwner,
        isSaveable: view.isOwner,
        ...(view.isOwner && {
          onEdit: () => onEdit(view.id as string),
          onSave: () => onSave(view.id as string),
        }),
      }),
    )

  // All Private Views: private views not owned by current user (admin only, read-only)
  const allPrivateViews = viewsList
    .filter((view) => view.visibility === 'private' && !view.isOwner && !view.working)
    .map((view) =>
      createViewItem(view, {
        isEditable: false,
        isSaveable: false,
      }),
    )

  return {
    myViews,
    sharedViews,
    allPrivateViews,
  }
}
