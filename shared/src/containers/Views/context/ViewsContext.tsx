import { createContext, useContext, FC, ReactNode, useState, useMemo, useCallback } from 'react'
import { ViewType, viewTypes, WORKING_VIEW_ID } from '../index'
import {
  GetDefaultViewApiResponse,
  useGetCurrentUserQuery,
  useGetWorkingViewQuery,
  useGetViewQuery,
  useListViewsQuery,
  UserModel,
  ViewListItemModel,
  viewsQueries,
  useGetShareOptionsQuery,
  ShareOption,
} from '@shared/api'
import useBuildViewMenuItems from '../hooks/useBuildViewMenuItems'
import { ViewMenuItem } from '../ViewsMenu/ViewsMenu'
import { usePowerpack } from '@shared/context'
import { useSelectedView } from '../hooks/useSelectedView'
import { UseViewMutations, useViewsMutations } from '../hooks/useViewsMutations'
import { useSaveViewFromCurrent } from '../hooks/useSaveViewFromCurrent'
import { useViewSettingsChanged } from '../hooks/useViewSettingsChanged'
import { useLocalStorage } from '@shared/hooks'

export type ViewData = GetDefaultViewApiResponse
export type ViewSettings = GetDefaultViewApiResponse['settings']
export type SelectedViewState = ViewData | undefined // id of view otherwise null with use working
export type EditingViewState = string | true | null // id of view being edited otherwise null

export type CollapsedViewState = Record<string, boolean>

export interface ViewsContextValue {
  // State
  viewType?: ViewType
  projectName?: string
  currentUser?: UserModel
  isMenuOpen: boolean
  editingView: EditingViewState
  selectedView: SelectedViewState

  // Views data
  viewsList: ViewListItemModel[]
  viewSettings: ViewSettings | undefined
  workingSettings: ViewSettings | undefined
  workingView: ViewListItemModel | undefined
  editingViewId: string | undefined
  viewMenuItems: ViewMenuItem[]
  editingViewData?: ViewData
  isLoadingEditingViewData: boolean
  isLoadingViews: boolean
  isViewWorking: boolean

  // Data
  shareOptions?: ShareOption[] // available users to share with (undefined means loading)

  // Actions
  setIsMenuOpen: (open: boolean) => void
  setEditingView: (editing: EditingViewState) => void
  setSelectedView: (viewId: string) => void
  onSettingsChanged: (changed: boolean) => void

  // Mutations
  onCreateView: UseViewMutations['onCreateView']
  onDeleteView: UseViewMutations['onDeleteView']
  onUpdateView: UseViewMutations['onUpdateView']

  // Actions (shared)
  resetWorkingView: () => Promise<void>

  // api
  api: typeof viewsQueries
  dispatch: any
}

const ViewsContext = createContext<ViewsContextValue | null>(null)

export interface ViewsProviderProps {
  children: ReactNode
  viewType?: string
  projectName?: string
  dispatch?: any
  debug?: {
    powerLicense?: boolean
  }
}

export const ViewsProvider: FC<ViewsProviderProps> = ({
  children,
  viewType: viewTypeProp,
  projectName,
  dispatch,
  debug,
}) => {
  // validate viewType
  const viewType = viewTypes.includes(viewTypeProp as ViewType)
    ? (viewTypeProp as ViewType)
    : undefined

  let { powerLicense } = usePowerpack()
  if (debug?.powerLicense !== undefined) {
    console.warn('Using debug power license:', debug.powerLicense)
    powerLicense = debug.powerLicense
  }

  const { data: currentUser } = useGetCurrentUserQuery()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [editingView, setEditingView] = useState<EditingViewState>(null)
  // Collapsed state persisted globally across all viewTypes and projects
  const stateKey = 'viewsMenuCollapsed'

  const [collapsedSections, setCollapsedSections] = useLocalStorage<CollapsedViewState>(
    stateKey,
    {},
  )

  // anything extra to do when a view is created successfully
  const handleOnViewCreated = (view: ViewData) => {
    const key = view.visibility === 'private' ? 'myViews' : 'sharedViews'
    // if the section is collapsed, expand it
    if (collapsedSections[key]) {
      const newCollapsedSections = { ...collapsedSections }
      newCollapsedSections[key] = false
      setCollapsedSections(newCollapsedSections)
    }
  }

  const { onCreateView, onDeleteView, onUpdateView, onResetWorkingView } = useViewsMutations({
    viewType,
    projectName,
    onCreate: handleOnViewCreated,
  })

  // when editing the view, get all users that can be shared to that view
  const { data: shareOptions } = useGetShareOptionsQuery(
    { projectName },
    { skip: !powerLicense || !editingView },
  )

  // setting of default views
  const [selectedView, setSelectedView, previousSelectedViewId] = useSelectedView({
    viewType: viewType as string,
    projectName: projectName,
  })

  const [viewSettingsChanged, setViewSettingsChanged] = useViewSettingsChanged({
    viewType: viewType as ViewType,
  })

  // Fetch views data
  const { currentData: viewsList = [], isLoading: isLoadingViews } = useListViewsQuery(
    { projectName: projectName, viewType: viewType as string },
    { skip: !viewType },
  )

  //   always get your working view
  const { currentData: workingView } = useGetWorkingViewQuery(
    { projectName: projectName, viewType: viewType as string },
    { skip: !viewType },
  )

  const workingSettings = workingView?.settings

  //   which settings to use for the view
  const viewSettings =
    !selectedView || selectedView.id === WORKING_VIEW_ID ? workingSettings : selectedView?.settings

  // is the working view selected?
  const isViewWorking = selectedView?.id === workingView?.id
  // were we just on a custom view and then edited it and ended up on the working view
  const editingViewId =
    viewSettingsChanged &&
    isViewWorking &&
    !!previousSelectedViewId &&
    previousSelectedViewId !== workingView?.id
      ? previousSelectedViewId
      : undefined

  // get data for the view we are editing
  const { currentData: editingViewDataData, isFetching: isLoadingEditingViewData } =
    useGetViewQuery(
      {
        viewId: editingView as string,
        projectName: isViewStudioScope(editingView as string, viewsList) ? undefined : projectName,
        viewType: viewType as string,
      },
      { skip: !(typeof editingView === 'string') || !powerLicense },
    )

  const editingViewData = useMemo(
    () => (editingView === editingViewDataData?.id ? editingViewDataData : undefined),
    [editingView, editingViewDataData],
  )

  const { onSaveViewFromCurrent } = useSaveViewFromCurrent({
    viewType: viewType,
    projectName,
    viewsList,
    sourceSettings: viewSettings,
    onUpdateView: onUpdateView,
  })

  // Reset working view to default (empty) settings
  const resetWorkingView = useCallback(async () => {
    try {
      await onResetWorkingView({
        existingWorkingViewId: workingView?.id,
        selectedViewId: selectedView?.id,
        setSelectedView,
        setSettingsChanged: setViewSettingsChanged,
        notify: true,
      })
    } catch (error) {
      console.error('Failed to reset view:', error)
    }
  }, [workingView, onResetWorkingView, selectedView, setSelectedView, setViewSettingsChanged])

  //   build the menu items for the views
  const viewMenuItems = useBuildViewMenuItems({
    viewsList,
    workingView,
    viewType,
    projectName,
    currentUser,
    useWorkingView: !powerLicense,
    editingViewId,
    selectedId: selectedView?.id,
    collapsed: collapsedSections,
    setCollapsed: setCollapsedSections,
    onResetWorkingView,
    onSelect: (viewId) => {
      setSelectedView(viewId)
      // reset the settings changed state when switching views
      setViewSettingsChanged(false)
      // close the menu when selecting a view
      setIsMenuOpen(false)
    },
    onEdit: (viewId) => setEditingView(viewId),
    onSave: async (viewId) => onSaveViewFromCurrent(viewId),
  })

  const value: ViewsContextValue = {
    viewType,
    projectName,
    isMenuOpen,
    editingView,
    currentUser,
    selectedView,
    viewSettings,
    workingSettings,
    editingViewData,
    isLoadingEditingViewData,
    viewsList,
    workingView,
    editingViewId,
    viewMenuItems,
    isLoadingViews,
    isViewWorking,
    // data
    shareOptions,
    setIsMenuOpen,
    setEditingView,
    setSelectedView,
    onSettingsChanged: setViewSettingsChanged,
    // mutations
    onCreateView,
    onUpdateView,
    onDeleteView,
    // shared actions
    resetWorkingView,
    // api
    api: viewsQueries,
    dispatch,
  }

  return <ViewsContext.Provider value={value}>{children}</ViewsContext.Provider>
}

export const useViewsContext = (): ViewsContextValue => {
  const context = useContext(ViewsContext)
  if (!context) {
    throw new Error('useViewsContext must be used within a ViewsProvider')
  }
  return context
}

export const isViewStudioScope = (viewId: string | undefined, viewsList: ViewListItemModel[]) => {
  if (!viewId) return true
  const view = viewsList.find((v) => v.id === viewId)
  return view?.scope === 'studio'
}