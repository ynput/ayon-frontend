import {
  GetWorkingViewApiResponse,
  useCreateViewMutation,
  UserModel,
  ViewListItemModel,
} from '@shared/api'
import { useCallback, useMemo } from 'react'
import { VIEW_DIVIDER, ViewMenuItem } from '../ViewsMenu/ViewsMenu'
import { ViewItem } from '../ViewItem/ViewItem'
import { Icon } from '@ynput/ayon-react-components'
import { generateWorkingView } from '../utils/generateWorkingView'
import { toast } from 'react-toastify'
import { useLoadModule } from '@shared/hooks/useLoadModule'
import { getCustomViewsFallback } from '../utils/getCustomViewsFallback'
import { usePowerpack } from '@shared/context'
import type { CollapsedViewState } from '../context'
import { WORKING_VIEW_ID } from '../types'
export type ViewListItemModelExtended = ViewListItemModel & {
  isOwner: boolean
  highlighted?: 'save' | 'edit'
}

type Props = {
  viewsList: ViewListItemModel[]
  workingView?: GetWorkingViewApiResponse
  viewType?: string
  viewAlias: string
  projectName?: string
  currentUser?: UserModel
  useWorkingView?: boolean
  editingViewId?: string // the preview id of the view being edited
  selectedId?: string
  collapsed: CollapsedViewState
  setCollapsed: (state: CollapsedViewState) => void
  onEdit: (viewId: string) => void
  onSelect: (viewId: string) => void
  onSave: (viewId: string) => Promise<void>
  onResetWorkingView?: () => void
}

const useBuildViewMenuItems = ({
  viewsList,
  workingView,
  viewType,
  viewAlias,
  projectName,
  currentUser,
  useWorkingView,
  editingViewId,
  collapsed,
  setCollapsed,
  onSelect,
  onEdit,
  onSave,
  onResetWorkingView,
  selectedId,
}: Props): ViewMenuItem[] => {
  const { powerLicense } = usePowerpack()

  // MUTATIONS
  const [createView] = useCreateViewMutation()

  const extendedViewsList: ViewListItemModelExtended[] = useMemo(
    () =>
      viewsList.map((view) => ({
        ...view,
        isOwner: view.owner === currentUser?.name,
        highlighted: editingViewId === view.id ? 'save' : undefined,
      })),
    [viewsList, currentUser, editingViewId],
  )

  const workingBaseView: ViewItem = {
    id: WORKING_VIEW_ID,
    label: useWorkingView
      ? `Personal ${viewAlias.toLowerCase()}`
      : `Working ${viewAlias.toLowerCase()}`,
    startContent: useWorkingView && <Icon icon="person" />,
    isEditable: false,
  }

  // if we have a working view, we use it, otherwise we create one
  const handleWorkingViewChange = useCallback(async () => {
    let workingViewId = workingView?.id
    if (!workingView) {
      // no working view found, create one
      try {
        console.warn(`No working ${viewAlias.toLowerCase()} found, creating a new one`)
        const workingView = generateWorkingView()
        await createView({
          genericViewPostModel: workingView,
          viewType: viewType as string,
          projectName: projectName,
        }).unwrap()
        // set id of the new view
        workingViewId = workingView.id
      } catch (error: any) {
        toast.error(`Failed to create working ${viewAlias}: ${error}`)
      }
    }
    // select the working view
    onSelect(workingViewId as string)
  }, [workingView, viewType, createView, projectName, onSelect])

  const handleEditView = async (viewId: string) => {
    // save the view and then selected it
    try {
      await onSave(viewId)
      onSelect(viewId)
    } catch (error: any) {
      toast.error(error)
    }
  }

  const [getCustomViews, { isLoading: isLoadingQueries }] = useLoadModule({
    addon: 'powerpack',
    remote: 'views',
    module: 'getCustomViews',
    fallback: getCustomViewsFallback,
    // minVersion: minVersion,
    skip: !viewType || !powerLicense,
  })

  // admins and managers also get public views that are not shared with them, keep those apart
  const [sharedViewsList, notSharedViewsList] = useMemo(() => {
    const shared: ViewListItemModelExtended[] = []
    const notShared: ViewListItemModelExtended[] = []
    extendedViewsList.forEach((view) =>
      (view.sharedWithMe === false ? notShared : shared).push(view),
    )
    return [shared, notShared]
  }, [extendedViewsList])

  const { myViews, sharedViews, allPrivateViews } = getCustomViews({
    viewsList: sharedViewsList,
    onEdit,
    onSelect,
    onSave: handleEditView,
  })

  // they are all public, so getCustomViews returns them as shared views
  const { sharedViews: notSharedViews } = getCustomViews({
    viewsList: notSharedViewsList,
    onEdit,
    onSelect,
    onSave: handleEditView,
  })

  const sections: Array<{
    id: string
    title: string
    items: ViewItem[]
    defaultCollapsed?: boolean
  }> = useMemo(() => {
    return [
      { id: 'myViews', title: `My ${viewAlias.toLowerCase()}s`, items: myViews as ViewItem[] },
      {
        id: 'sharedViews',
        title: `Shared ${viewAlias.toLowerCase()}s`,
        items: sharedViews as ViewItem[],
      },
      {
        id: 'allPrivateViews',
        title: `All private ${viewAlias.toLowerCase()}s`,
        items: allPrivateViews as ViewItem[],
      },
      {
        id: 'notSharedViews',
        title: 'All views (admin only)',
        items: notSharedViews as ViewItem[],
        defaultCollapsed: true,
      },
    ]
  }, [myViews, sharedViews, allPrivateViews, notSharedViews, viewAlias])

  const isSectionCollapsed = useCallback(
    (id: string) => collapsed[id] ?? !!sections.find((s) => s.id === id)?.defaultCollapsed,
    [collapsed, sections],
  )

  const toggleSection = useCallback(
    (id: string) => {
      setCollapsed({ ...collapsed, [id]: !isSectionCollapsed(id) })
    },
    [collapsed, setCollapsed, isSectionCollapsed],
  )

  const workingViewItem: ViewMenuItem = useMemo(() => {
    return {
      ...workingBaseView,
      onClick: handleWorkingViewChange,
      // expose reset button when handler is provided
      isEditable: Boolean(onResetWorkingView),
      onResetView: onResetWorkingView,
    }
  }, [handleWorkingViewChange, onResetWorkingView])

  // Build list with headers after computing items, omit sections with no items, and hide items when collapsed
  const viewItems: ViewMenuItem[] = useMemo(() => {
    const result: ViewMenuItem[] = [workingViewItem]

    // Add divider only if any section exists and powerpack is available
    const visibleSections = sections.filter((s) => powerLicense && (s.items?.length || 0) > 0)
    if (visibleSections.length > 0) result.push(VIEW_DIVIDER)

    visibleSections.forEach((section) => {
      const isCollapsed = isSectionCollapsed(section.id)
      result.push({
        type: 'section',
        id: section.id,
        title: section.title,
        collapsed: isCollapsed,
        onToggle: () => toggleSection(section.id),
      })
      if (!isCollapsed) {
        result.push(...section.items)
      } else if (selectedId) {
        const selectedItem = section.items.find((i) => i.id === selectedId)
        if (selectedItem) result.push(selectedItem)
      }
    })

    return result
  }, [workingViewItem, sections, isSectionCollapsed, toggleSection, selectedId, powerLicense])

  return viewItems
}

export default useBuildViewMenuItems
