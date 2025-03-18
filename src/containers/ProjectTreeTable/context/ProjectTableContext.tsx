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

export type InheritedDependent = {
  entityId: string
  entityType: 'task' | 'folder'
  inheritedAttribs: string[]
}

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
  getInheritedDependents: (entities: { id: string; attribs: string[] }[]) => InheritedDependent[]
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

  // Pre-compute folder-children relationships
  const folderChildrenMap = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const folder of foldersMap.values()) {
      const parentId = folder.parentId
      if (!parentId) continue

      if (!map.has(parentId)) {
        map.set(parentId, [])
      }
      map.get(parentId)!.push(folder.id)
    }
    return map
  }, [foldersMap])

  const getChildrenEntities = useCallback(
    (id: string) => {
      const descendants: (MatchingFolder | EditorTaskNode)[] = []
      const queue: string[] = [id]
      const visited = new Set<string>()

      while (queue.length > 0) {
        const currentId = queue.shift()!

        if (visited.has(currentId)) continue
        visited.add(currentId)

        // Skip adding the root folder to descendants
        if (currentId !== id) {
          const folder = foldersMap.get(currentId)
          if (folder) descendants.push(folder)
        }

        // Add tasks efficiently with a single lookup
        const taskIds = tasksByFolderMap.get(currentId)
        if (taskIds?.length) {
          for (const taskId of taskIds) {
            const task = tasksMap.get(taskId)
            if (task) descendants.push(task)
          }
        }

        // Add folder children to queue
        const childFolderIds = folderChildrenMap.get(currentId)
        if (childFolderIds?.length) {
          queue.push(...childFolderIds)
        }
      }

      return descendants
    },
    [foldersMap, tasksByFolderMap, tasksMap, folderChildrenMap],
  )

  // Optimized implementation of getInheritedDependents
  const getInheritedDependents = useCallback(
    (entities: { id: string; attribs: string[] }[]) => {
      if (!entities.length) return []

      // Process all entities in one batch for efficiency
      const result: {
        entityId: string
        entityType: 'task' | 'folder'
        inheritedAttribs: string[]
      }[] = []

      for (const entity of entities) {
        if (!entity.attribs.length) continue

        const children = getChildrenEntities(entity.id)
        if (!children.length) continue

        for (const child of children) {
          if (!child.ownAttrib) continue

          const inheritedAttribs = entity.attribs.filter(
            (attrib) => !child.ownAttrib.includes(attrib),
          )
          if (inheritedAttribs.length) {
            // Check if entity already exists in the result
            const existingEntityIndex = result.findIndex((item) => item.entityId === child.id)

            if (existingEntityIndex !== -1) {
              // Merge attributes (ensure uniqueness)
              const existingAttribs = result[existingEntityIndex].inheritedAttribs
              const mergedAttribs = [...new Set([...existingAttribs, ...inheritedAttribs])]
              result[existingEntityIndex].inheritedAttribs = mergedAttribs
            } else {
              // Add new entity
              result.push({
                entityId: child.id,
                entityType: 'folderId' in child ? 'task' : 'folder',
                inheritedAttribs,
              })
            }
          }
        }
      }

      return result
    },
    [getChildrenEntities],
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
        getInheritedDependents,
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
