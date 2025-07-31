import { createContext, useContext, FC, ReactNode, useState } from 'react'
import { ViewType, PERSONAL_VIEW_ID } from '../index'
import {
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

export type SelectedViewState = string | null // id of view otherwise null with use personal
export type EditingViewState = { viewId: string | undefined } | null // id of view being edited otherwise null

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
  isLoadingViews: boolean

  // Actions
  setIsMenuOpen: (open: boolean) => void
  setEditingView: (editing: EditingViewState) => void
  setSelectedView: (selected: SelectedViewState) => void
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
  let { powerLicense } = usePowerpack()
  if (debug?.powerLicense !== undefined) {
    console.warn('Using debug power license:', debug.powerLicense)
    powerLicense = debug.powerLicense
  }
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [editingView, setEditingView] = useState<EditingViewState>(null)
  const [selectedView, setSelectedView] = useState<SelectedViewState>(null)

  const viewType = viewTypes.includes(viewTypeProp as ViewType)
    ? (viewTypeProp as ViewType)
    : undefined
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

  //   if the selected view is not the personal view, get the data for it
  const { data: selectedViewData } = useGetViewQuery(
    { viewId: selectedView as string, projectName: projectName, viewType: viewType as string },
    { skip: !selectedView || selectedView === PERSONAL_VIEW_ID || !powerLicense },
  )

  //   which settings to use for the view
  const viewSettings =
    selectedView === PERSONAL_VIEW_ID ? personalView?.settings : selectedViewData?.settings

  //   build the menu items for the views
  const viewMenuItems = useBuildViewMenuItems({
    viewsList,
    personalView,
    viewType,
    projectName,
    onSelect: setSelectedView,
    onEdit: (viewId: string) => setEditingView({ viewId }),
  })

  const value: ViewsContextValue = {
    viewType,
    projectName,
    isMenuOpen,
    editingView,
    selectedView,
    viewSettings,
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
