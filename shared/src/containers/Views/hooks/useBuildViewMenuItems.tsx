import { useCreateViewMutation, UserModel, ViewListItemModel, useSetDefaultViewMutation, GetWorkingViewApiResponse } from '@shared/api'
import { useCallback, useMemo } from 'react'
import { VIEW_DIVIDER, ViewMenuItem } from '../ViewsMenu/ViewsMenu'
import { ViewItem } from '../ViewItem/ViewItem'
import { Icon } from '@ynput/ayon-react-components'
import { generateWorkingView, generateViewId } from '../utils/generateWorkingView'
import { toast } from 'react-toastify'
import { useLoadModule, useLocalStorage } from '@shared/hooks'
import { getCustomViewsFallback } from '../utils/getCustomViewsFallback'
import { usePowerpack, useRemoteModules } from '@shared/context'
import { CollapsedViewState } from '../context/ViewsContext'
import { confirmDialog } from 'primereact/confirmdialog'

// constants
export const WORKING_VIEW_ID = '_working_' as const
export const NEW_VIEW_ID = '_new_view_' as const
export type ViewListItemModelExtended = ViewListItemModel & {
  isOwner: boolean
  highlighted?: 'save' | 'edit'
}

type Props = {
  viewsList: ViewListItemModel[]
  workingView?: GetWorkingViewApiResponse
  viewType?: string
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
  const { powerLicense, setPowerpackDialog } = usePowerpack()
  const { modules } = useRemoteModules()

  // Get powerpack version
  const powerpackModule = modules.find((m) => m.addonName === 'powerpack')
  const powerpackVersion = powerpackModule?.addonVersion

  // MUTATIONS
  const [createView] = useCreateViewMutation()
  const [setDefaultView] = useSetDefaultViewMutation()

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
    label: useWorkingView ? 'Personal view' : 'Working view',
    startContent: useWorkingView && <Icon icon="person" />,
    isEditable: false,
  }

  // if we have a working view, we use it, otherwise we create one
  const handleWorkingViewChange = useCallback(async () => {
    let workingViewId = workingView?.id
    if (!workingView) {
      // no working view found, create one
      try {
        console.warn('No working view found, creating a new one')
        const workingView = generateWorkingView()
        await createView({
          payload: workingView,
          viewType: viewType as string,
          projectName: projectName,
        }).unwrap()
        // set id of the new view
        workingViewId = workingView.id
      } catch (error: any) {
        toast.error(`Failed to create working view: ${error}`)
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
  const onMakeDefaultView = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()



      confirmDialog({
        message: 'Set this view as the default for all users in this project?',
        header: 'Confirm Default View',
        accept: async () => {
          try {
            const existingDefaultView = viewsList.find((view) => view.label === '_default_')
            let defaultViewId: string

            if (existingDefaultView) {
              defaultViewId = existingDefaultView.id as string
              await onSave(defaultViewId)
            } else {
              // Create new _default_ view
              defaultViewId = generateViewId()

              // Use settings from working view, or default to empty settings if not available
              const settings = workingView?.settings || {}

              const defaultViewPayload = {
                id: defaultViewId,
                label: '_default_',
                working: true,
                visibility: 'public',
                settings,
              } as any

              await createView({
                payload: defaultViewPayload,
                viewType: viewType as string,
                projectName: projectName,
              }).unwrap()

            }

          } catch (error: any) {
            console.error('Failed to set default view:', error)
            toast.error(`Failed to set default view: ${error?.message || error}`)
          }
        },
      })
    },
    [powerLicense, setPowerpackDialog, workingView, viewsList, viewType, projectName, createView, setDefaultView, onSave, powerpackVersion],
  )

  const [getCustomViews, { isLoading: isLoadingQueries }] = useLoadModule({
    addon: 'powerpack',
    remote: 'views',
    module: 'getCustomViews',
    fallback: getCustomViewsFallback,
    // minVersion: minVersion,
    skip: !viewType || !powerLicense,
  })

  const { myViews, sharedViews, allPrivateViews } = getCustomViews({
    viewsList: extendedViewsList,
    onEdit,
    onSelect,
    onSave: handleEditView,
  })

  const toggleSection = useCallback(
    (id: string) => {
      setCollapsed({ ...collapsed, [id]: !collapsed[id] })
    },
    [collapsed, setCollapsed],
  )

  const sections: Array<{ id: string; title: string; items: ViewItem[] }> = useMemo(() => {
    return [
      { id: 'myViews', title: 'My views', items: myViews as ViewItem[] },
      { id: 'sharedViews', title: 'Shared views', items: sharedViews as ViewItem[] },
      { id: 'allPrivateViews', title: 'All private views', items: allPrivateViews as ViewItem[] },
    ]
  }, [myViews, sharedViews, allPrivateViews])

  const workingViewItem: ViewMenuItem = useMemo(
    () => ({
      ...workingBaseView,
      onClick: handleWorkingViewChange,
      // expose reset button when handler is provided
      isEditable: Boolean(onResetWorkingView),
      onResetView: onResetWorkingView,
      onMakeDefaultView: onMakeDefaultView,
    }),
    [handleWorkingViewChange, onResetWorkingView, onMakeDefaultView],
  )

  // Build list with headers after computing items, omit sections with no items, and hide items when collapsed
  const viewItems: ViewMenuItem[] = useMemo(() => {
    const result: ViewMenuItem[] = [workingViewItem]

    // Add divider only if any section exists
    const visibleSections = sections.filter((s) => (s.items?.length || 0) > 0)
    if (visibleSections.length > 0) result.push(VIEW_DIVIDER)

    visibleSections.forEach((section) => {
      const isCollapsed = !!collapsed[section.id]
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

    // Add a closing divider after all sections (only if sections exist)
    if (visibleSections.length > 0) result.push(VIEW_DIVIDER)

    return result
  }, [workingViewItem, sections, collapsed, toggleSection, selectedId])

  return viewItems
}

export default useBuildViewMenuItems
