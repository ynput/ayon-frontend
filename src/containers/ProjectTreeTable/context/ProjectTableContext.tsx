import { createContext, ReactNode, useCallback, useContext, useMemo } from 'react'
import {
  ExpandedState,
  functionalUpdate,
  OnChangeFn,
  RowSelectionState,
} from '@tanstack/react-table'
import useLocalStorage from '@hooks/useLocalStorage'
import useFetchAndUpdateEntityData from '../hooks/useFetchEditorEntities'
import useOverviewTable from '../hooks/useOverviewTable'
import { useAppSelector } from '@state/store'
import { useSlicerContext } from '@context/slicerContext'
import { isEmpty } from 'lodash'
import useFilterBySlice from '@containers/TasksProgress/hooks/useFilterBySlice'
import { Filter } from '@ynput/ayon-react-components'
import { useGetProjectQuery } from '@queries/project/getProject'
import {
  EditorTaskNode,
  FolderNodeMap,
  MatchingFolder,
  TableRow,
  TaskNodeMap,
} from '../utils/types'
import { ProjectModel } from '@api/rest/project'
import useAttributeFields from '../hooks/useAttributesList'
import { AttributeModel } from '@api/rest/attributes'

interface ProjectTableContextProps {
  tableData: TableRow[]
  tasksMap: TaskNodeMap
  foldersMap: FolderNodeMap
  isLoading: boolean
  fetchNextPage: () => void
  filters: Filter[]
  setFilters: (filters: Filter[]) => void
  showHierarchy: boolean
  updateShowHierarchy: (showHierarchy: boolean) => void
  projectInfo?: ProjectModel
  expanded: ExpandedState
  updateExpanded: OnChangeFn<ExpandedState>
  projectName: string
  attribFields: AttributeModel[]
  getEntityById: (id: string) => MatchingFolder | EditorTaskNode | undefined
}

const ProjectTableContext = createContext<ProjectTableContextProps | undefined>(undefined)

interface ProjectTableProviderProps {
  children: ReactNode
}

export const ProjectTableProvider = ({ children }: ProjectTableProviderProps) => {
  const projectName = useAppSelector((state) => state.project.name) || ''
  const scope = `overview-${projectName}`

  const { data: projectInfo } = useGetProjectQuery({ projectName }, { skip: !projectName })
  const { folderTypes = [], taskTypes = [] } = projectInfo || {}

  const { attribFields } = useAttributeFields()

  const [expanded, setExpanded] = useLocalStorage<ExpandedState>(`expanded-${scope}`, {})
  const updateExpanded: OnChangeFn<ExpandedState> = (expandedUpdater) => {
    setExpanded(functionalUpdate(expandedUpdater, expanded))
  }

  const [filters, setFilters] = useLocalStorage<Filter[]>(`overview-filters-${projectName}`, [])
  const [showHierarchy, updateShowHierarchy] = useLocalStorage<boolean>(
    `overview-show-hierarchy-${projectName}`,
    true,
  )

  const { rowSelection, sliceType, persistentRowSelectionData } = useSlicerContext()

  // filter out by slice
  const persistedHierarchySelection = isEmpty(persistentRowSelectionData)
    ? null
    : persistentRowSelectionData

  const selectedFolders = useMemo(() => {
    let selection: RowSelectionState = {}

    if (sliceType === 'hierarchy') {
      selection = rowSelection
    } else if (persistedHierarchySelection) {
      selection = Object.values(persistedHierarchySelection).reduce((acc: any, item) => {
        acc[item.id] = !!item
        return acc
      }, {})
    }

    // Process the selection inside useMemo
    return Object.entries(selection)
      .filter(([, value]) => value)
      .map(([id]) => id)
  }, [rowSelection, persistedHierarchySelection, sliceType])

  const { filter: sliceFilter } = useFilterBySlice()

  // merge the slice filter with the user filters
  let combinedFilters = [...filters]
  if (sliceFilter) {
    combinedFilters.push(sliceFilter)
  }

  console.time('dataToTable')

  const { foldersMap, tasksMap, tasksByFolderMap, fetchNextPage, isLoading } =
    useFetchAndUpdateEntityData({
      projectName,
      selectedFolders,
      filters,
      expanded,
      showHierarchy,
    })

  const tableData = useOverviewTable({
    foldersMap,
    tasksMap,
    tasksByFolderMap,
    expanded,
    folderTypes,
    taskTypes,
    showHierarchy,
  })
  console.timeEnd('dataToTable')

  const getEntityById = useCallback(
    (id: string): MatchingFolder | EditorTaskNode | undefined => {
      // Check if it's a folder
      if (foldersMap.has(id)) {
        return foldersMap.get(id)
      }
      // Check if it's a task
      if (tasksMap.has(id)) {
        return tasksMap.get(id)
      }
      // Return undefined if not found
      return undefined
    },
    [foldersMap, tasksMap],
  )

  return (
    <ProjectTableContext.Provider
      value={{
        expanded,
        updateExpanded,
        tableData,
        tasksMap,
        foldersMap,
        isLoading,
        fetchNextPage,
        filters,
        setFilters,
        showHierarchy,
        updateShowHierarchy,
        projectInfo: projectInfo,
        projectName,
        attribFields,
        getEntityById,
      }}
    >
      {children}
    </ProjectTableContext.Provider>
  )
}

export const useProjectTableContext = () => {
  const context = useContext(ProjectTableContext)
  if (!context) {
    throw new Error('useProjectTableContext must be used within a ProjectTableProvider')
  }
  return context
}
