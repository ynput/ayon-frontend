import { createContext, useContext, FC, ReactNode, useState, useMemo, useCallback } from 'react'
import { ViewType, WORKING_VIEW_ID } from '../index'
import {
  GetDefaultViewApiResponse,
  useGetCurrentUserQuery,
  useGetWorkingViewQuery,
  useGetViewQuery,
  useListViewsQuery,
  UserModel,
  ViewListItemModel,
  viewsQueries,
} from '@shared/api'
import useBuildViewMenuItems from '../hooks/useBuildViewMenuItems'
import { ViewMenuItem } from '../ViewsMenu/ViewsMenu'
import { usePowerpack } from '@shared/context'
import { useSelectedView } from '../hooks/useSelectedView'
import { UseViewMutations, useViewsMutations } from '../hooks/useViewsMutations'
import { useSaveViewFromCurrent } from '../hooks/useSaveViewFromCurrent'

export type ViewData = GetDefaultViewApiResponse
export type ViewSettings = GetDefaultViewApiResponse['settings']
export type SelectedViewState = ViewData | undefined // id of view otherwise null with use working
export type EditingViewState = string | true | null // id of view being edited otherwise null

const viewTypes = ['overview', 'taskProgress'] as const
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
  isLoadingViews: boolean
  isViewWorking: boolean

  // Actions
  setIsMenuOpen: (open: boolean) => void
  setEditingView: (editing: EditingViewState) => void
  setSelectedView: (viewId: string) => void
  onSettingsChanged: (changed: boolean) => void

  // Mutations
  onCreateView: UseViewMutations['onCreateView']
  onDeleteView: UseViewMutations['onDeleteView']
  onUpdateView: UseViewMutations['onUpdateView']

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

  const { onCreateView, onDeleteView, onUpdateView } = useViewsMutations({ viewType, projectName })

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [editingView, setEditingView] = useState<EditingViewState>(null)

  // setting of default views
  const [selectedView, setSelectedView, previousSelectedViewId] = useSelectedView({
    viewType: viewType as string,
    projectName: projectName,
  })
  // have there been settings changes to a view that had selected?
  // this determines if we should show the save button in the menu
  const [viewSettingsChanged, setViewSettingsChanged] = useState(false)
  const onSettingsChanged = useCallback(
    (changed: boolean) => {
      setViewSettingsChanged(changed)
    },
    [setViewSettingsChanged],
  )

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
  const { currentData: editingViewDataData } = useGetViewQuery(
    { viewId: editingView as string, projectName: projectName, viewType: viewType as string },
    { skip: !(typeof editingView === 'string') || !powerLicense },
  )

  const editingViewData = useMemo(
    () => (editingView === editingViewDataData?.id ? editingViewDataData : undefined),
    [editingView, editingViewDataData],
  )

  const { onSaveViewFromCurrent } = useSaveViewFromCurrent({
    viewType: viewType,
    projectName,
    sourceView: selectedView,
    onUpdateView: onUpdateView,
  })

  //   build the menu items for the views
  const viewMenuItems = useBuildViewMenuItems({
    viewsList,
    workingView,
    viewType,
    projectName,
    currentUser,
    useWorkingView: !powerLicense,
    editingViewId,
    onSelect: (viewId) => {
      setSelectedView(viewId)
      // reset the settings changed state when switching views
      setViewSettingsChanged(false)
    },
    onEdit: (viewId) => setEditingView(viewId),
    onSave: (viewId) => onSaveViewFromCurrent(viewId),
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
    viewsList,
    workingView,
    editingViewId,
    viewMenuItems,
    isLoadingViews,
    isViewWorking,
    setIsMenuOpen,
    setEditingView,
    setSelectedView,
    onSettingsChanged,
    // mutations
    onCreateView,
    onUpdateView,
    onDeleteView,
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
