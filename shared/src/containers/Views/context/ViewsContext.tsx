import { createContext, useContext, FC, ReactNode, useState } from 'react'
import { ViewType, PERSONAL_VIEW_ID, ViewFormData } from '../index'
import {
  GetDefaultViewApiResponse,
  OverviewSettings,
  TaskProgressSettings,
  useGetPersonalViewQuery,
  useGetViewQuery,
  useListViewsQuery,
  ViewListItemModel,
} from '@shared/api'
import useBuildViewMenuItems from '../hooks/useBuildViewMenuItems'
import { ViewMenuItem } from '../ViewsMenu/ViewsMenu'
import { usePowerpack } from '@shared/context'
import { useSelectedView } from '../hooks/useSelectedView'

export type ViewData = GetDefaultViewApiResponse
export type SelectedViewState = ViewData | undefined // id of view otherwise null with use personal
export type EditingViewState = string | true | null // id of view being edited otherwise null

const viewTypes = ['overview', 'taskProgress'] as const
interface ViewsContextValue {
  // State
  viewType?: ViewType
  projectName?: string
  isMenuOpen: boolean
  editingView: EditingViewState
  selectedView: SelectedViewState

  // Views data
  viewsList: ViewListItemModel[]
  viewSettings: TaskProgressSettings | OverviewSettings | undefined
  personalView: ViewListItemModel | undefined
  viewMenuItems: ViewMenuItem[]
  editingViewData?: ViewData
  isLoadingViews: boolean

  // Actions
  setIsMenuOpen: (open: boolean) => void
  setEditingView: (editing: EditingViewState) => void
  setSelectedView: (viewId: string) => void
}

const ViewsContext = createContext<ViewsContextValue | null>(null)

export interface ViewsProviderProps {
  children: ReactNode
  viewType?: string
  projectName?: string
  debug?: {
    powerLicense?: boolean
  }
}

export const ViewsProvider: FC<ViewsProviderProps> = ({
  children,
  viewType: viewTypeProp,
  projectName,
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [editingView, setEditingView] = useState<EditingViewState>(null)

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

  //   which settings to use for the view
  const viewSettings =
    !selectedView || selectedView.id === PERSONAL_VIEW_ID
      ? personalView?.settings
      : selectedView?.settings

  // get data for the view we are editing
  const { data: editingViewData } = useGetViewQuery(
    { viewId: editingView as string, projectName: projectName, viewType: viewType as string },
    { skip: !editingView || !powerLicense },
  )

  //   build the menu items for the views
  const viewMenuItems = useBuildViewMenuItems({
    viewsList,
    personalView,
    viewType,
    projectName,
    onSelect: setSelectedView,
    onEdit: (viewId) => setEditingView(viewId),
  })

  const value: ViewsContextValue = {
    viewType,
    projectName,
    isMenuOpen,
    editingView,
    selectedView,
    viewSettings,
    editingViewData,
    viewsList,
    personalView,
    viewMenuItems,
    isLoadingViews,
    setIsMenuOpen,
    setEditingView,
    setSelectedView,
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
