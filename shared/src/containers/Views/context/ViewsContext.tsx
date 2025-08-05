import { createContext, useContext, FC, ReactNode, useState, useMemo, useCallback } from 'react'
import { ViewType, PERSONAL_VIEW_ID } from '../index'
import {
  GetDefaultViewApiResponse,
  useGetCurrentUserQuery,
  useGetPersonalViewQuery,
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

export type ViewData = GetDefaultViewApiResponse
export type ViewSettings = GetDefaultViewApiResponse['settings']
export type SelectedViewState = ViewData | undefined // id of view otherwise null with use personal
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
  personalSettings: ViewSettings | undefined
  personalView: ViewListItemModel | undefined
  viewMenuItems: ViewMenuItem[]
  editingViewData?: ViewData
  isLoadingViews: boolean
  isViewPersonal: boolean

  // Actions
  setIsMenuOpen: (open: boolean) => void
  setEditingView: (editing: EditingViewState) => void
  setSelectedView: (viewId: string) => void

  // Mutations
  onCreateView: UseViewMutations['onCreateView']
  onDeleteView: UseViewMutations['onDeleteView']

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

  const { onCreateView, onDeleteView } = useViewsMutations({ viewType, projectName })

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [editingView, setEditingView] = useState<EditingViewState>(null)

  // setting of default views
  const [selectedView, setSelectedView] = useSelectedView({
    viewType: viewType as string,
    projectName: projectName,
  })

  const skipViewsList = !viewType || !projectName || !powerLicense

  // Fetch views data
  const { data: viewsList = [], isLoading: isLoadingViews } = useListViewsQuery(
    { projectName: projectName, viewType: viewType as string },
    { skip: skipViewsList },
  )

  //   always get your personal view
  const { data: personalView } = useGetPersonalViewQuery(
    { projectName: projectName, viewType: viewType as string },
    { skip: !viewType || !projectName },
  )

  const personalSettings = personalView?.settings

  //   which settings to use for the view
  const viewSettings =
    !selectedView || selectedView.id === PERSONAL_VIEW_ID
      ? personalSettings
      : selectedView?.settings

  const isViewPersonal = selectedView?.id === personalView?.id

  // get data for the view we are editing
  const { data: editingViewDataData } = useGetViewQuery(
    { viewId: editingView as string, projectName: projectName, viewType: viewType as string },
    { skip: !(typeof editingView === 'string') || !powerLicense },
  )

  const editingViewData = useMemo(
    () => (editingView === editingViewDataData?.id ? editingViewDataData : undefined),
    [editingView, editingViewDataData],
  )

  //   build the menu items for the views
  const viewMenuItems = useBuildViewMenuItems({
    viewsList,
    personalView,
    viewType,
    projectName,
    currentUser,
    onSelect: setSelectedView,
    onEdit: (viewId) => setEditingView(viewId),
  })

  const value: ViewsContextValue = {
    viewType,
    projectName,
    isMenuOpen,
    editingView,
    currentUser,
    selectedView,
    viewSettings,
    personalSettings,
    editingViewData,
    viewsList,
    personalView,
    viewMenuItems,
    isLoadingViews,
    isViewPersonal,
    setIsMenuOpen,
    setEditingView,
    setSelectedView,
    // mutations
    onCreateView,
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
