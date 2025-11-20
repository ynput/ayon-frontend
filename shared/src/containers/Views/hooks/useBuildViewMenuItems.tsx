import {
  GetWorkingViewApiResponse,
  useCreateViewMutation,
  UserModel,
  useSetDefaultViewMutation,
  ViewListItemModel,
  useUpdateViewMutation,
  viewsQueries,
} from '@shared/api'
import { useDispatch } from 'react-redux'
import type { AnyAction, ThunkDispatch } from '@reduxjs/toolkit'
import { useCallback, useMemo } from 'react'
import { VIEW_DIVIDER, ViewMenuItem } from '../ViewsMenu/ViewsMenu'
import { ViewItem } from '../ViewItem/ViewItem'
import { Icon } from '@ynput/ayon-react-components'
import { generateWorkingView } from '../utils/generateWorkingView'
import { toast } from 'react-toastify'
import { useLoadModule } from '@shared/hooks'
import { getCustomViewsFallback } from '../utils/getCustomViewsFallback'
import { usePowerpack } from '@shared/context'
import { CollapsedViewState } from '../context/ViewsContext'
import { confirmDialog } from 'primereact/confirmdialog'

// constants
export const WORKING_VIEW_ID = '_working_' as const
export const NEW_VIEW_ID = '_new_view_' as const
export const BASE_VIEW_ID = '__base__' as const
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
  const { powerLicense } = usePowerpack()
  const dispatch = useDispatch<ThunkDispatch<any, any, AnyAction>>()

  // MUTATIONS
  const [createView] = useCreateViewMutation()
  const [updateView] = useUpdateViewMutation()
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
  // Handler to make any view the base view
  const createMakeBaseViewHandler = useCallback(
    (sourceViewId?: string) => async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()

      // Get existing base views for both scopes
      const existingProjectBaseView = viewsList.find(
        (view) => view.label === BASE_VIEW_ID && view.scope === 'project'
      )
      const existingStudioBaseView = viewsList.find(
        (view) => view.label === BASE_VIEW_ID && view.scope === 'studio'
      )

      // Show a dialog to select scope
      confirmDialog({
        message: 'Choose the scope for this default view. Click "Project" for this project only, or "Studio" for all projects in the studio.',
        header: 'Choose default view Scope',
        acceptLabel: 'Project',
        rejectLabel: 'Studio',
        accept: async () => {
          // Handle project scope selection
          const existingBase = existingProjectBaseView
          try {
            // Get settings from the source view
            let settings = workingView?.settings || {}

            // If sourceViewId is provided (clicking pin on a custom view), fetch that view's settings
            if (sourceViewId) {
              const sourceView = viewsList.find((v) => v.id === sourceViewId)
              const isStudioScope = sourceView?.scope === 'studio'

              const sourceViewPromise = dispatch(
                viewsQueries.endpoints.getView.initiate({
                  viewId: sourceViewId,
                  viewType: viewType as string,
                  projectName: isStudioScope ? undefined : projectName,
                })
              )

              const sourceViewResult = await sourceViewPromise

              if (sourceViewResult.data?.settings) {
                settings = sourceViewResult.data.settings
              }

              // Cleanup: unsubscribe if the method exists
              if ('unsubscribe' in sourceViewPromise && typeof sourceViewPromise.unsubscribe === 'function') {
                sourceViewPromise.unsubscribe()
              }
            }

            // Create or update the base view with the copied settings
            if (existingBase) {
              const baseViewId = existingBase.id as string
              await updateView({
                viewId: baseViewId,
                viewType: viewType as string,
                projectName: projectName,
                payload: { settings },
              }).unwrap()
              toast.success(`Default view updated successfully for project`)
            } else {
              const baseViewPayload = {
                label: BASE_VIEW_ID,
                working: false,
                settings,
              } as any

              await createView({
                payload: baseViewPayload,
                viewType: viewType as string,
                projectName: projectName,
              }).unwrap()
              toast.success(`Default view created successfully for project`)
            }
          } catch (error: any) {
            console.error('Failed to set Default view:', error)
            toast.error(`Failed to set Default view: ${error?.message || error}`)
          }
        },
        reject: async () => {
          // Handle studio scope selection
          const existingBase = existingStudioBaseView
          try {
            // Get settings from the source view
            let settings = workingView?.settings || {}

            // If sourceViewId is provided (clicking pin on a custom view), fetch that view's settings
            if (sourceViewId) {
              const sourceViewPromise = dispatch(
                viewsQueries.endpoints.getView.initiate({
                  viewId: sourceViewId,
                  viewType: viewType as string,
                  projectName: undefined
                })
              )

              const sourceViewResult = await sourceViewPromise

              if (sourceViewResult.data?.settings) {
                settings = sourceViewResult.data.settings
              }

              // Cleanup: unsubscribe if the method exists
              if ('unsubscribe' in sourceViewPromise && typeof sourceViewPromise.unsubscribe === 'function') {
                sourceViewPromise.unsubscribe()
              }
            }

            // Create or update the base view with the copied settings
            if (existingBase) {
              const baseViewId = existingBase.id as string
              await updateView({
                viewId: baseViewId,
                viewType: viewType as string,
                projectName: undefined,
                payload: { settings },
              }).unwrap()
              toast.success(`Default view updated successfully for studio`)
            } else {
              const baseViewPayload = {
                label: BASE_VIEW_ID,
                working: false,
                settings,
              } as any

              await createView({
                payload: baseViewPayload,
                viewType: viewType as string,
                projectName: undefined,
              }).unwrap()
              toast.success(`Default view created successfully for studio`)
            }
          } catch (error: any) {
            console.error('Failed to set base view:', error)
            toast.error(`Failed to set base view: ${error?.message || error}`)
          }

        },
      })
    },
    [workingView, viewsList, viewType, projectName, createView, updateView, dispatch],
  )

  // Handler for working view specifically
  const onMakeBaseView = useCallback(createMakeBaseViewHandler(), [createMakeBaseViewHandler])

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
    onMakeDefaultView: createMakeBaseViewHandler,
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

  const workingViewItem: ViewMenuItem = useMemo(() => {
    return {
      ...workingBaseView,
      onClick: handleWorkingViewChange,
      // expose reset button when handler is provided
      isEditable: Boolean(onResetWorkingView),
      onResetView: onResetWorkingView,
      onMakeDefaultView: onMakeBaseView,
      makeDefaultTooltip: 'Set as Default',
    }
  }, [handleWorkingViewChange, onResetWorkingView, onMakeBaseView, viewsList])

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
