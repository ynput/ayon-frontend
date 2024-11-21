import { useAppSelector } from '@state/store'
import { useEffect, useState } from 'react'
import useHierarchyTable from './useHierarchyTable'
import useUsersTable from './useUsersTable'
import { TableRow } from '../SlicerTable'
import useProjectAnatomySlices from './useProjectAnatomySlices'
import { SliceType, useSlicerContext } from '@context/slicerContext'

interface Props {
  sliceFields: SliceType[]
}

interface SliceOption {
  value: SliceType
  label: string
  icon: string
}

interface SliceData {
  getData: () => Promise<TableRow[]>
  isLoading: boolean
  isExpandable: boolean
}

interface Slice {
  data: TableRow[]
  isExpandable: boolean
}

interface TableData {
  sliceOptions: SliceOption[]
  table: Slice
  isLoading: boolean
  sliceType: SliceType
  handleSliceTypeChange: (sliceType: SliceType) => void
}

const useTableDataBySlice = ({ sliceFields }: Props): TableData => {
  const { sliceType, onSliceTypeChange } = useSlicerContext()
  const projectName = useAppSelector((state) => state.project.name)

  const defaultSliceOptions: SliceOption[] = [
    {
      label: 'Hierarchy',
      value: 'hierarchy' as SliceType,
      icon: 'table_rows',
    },
    {
      label: 'Assignees',
      value: 'users' as SliceType,
      icon: 'person',
    },
    {
      label: 'Status',
      value: 'status' as SliceType,
      icon: 'arrow_circle_right',
    },
    {
      label: 'Type',
      value: 'type' as SliceType, // combination of folder and task types
      icon: 'folder',
    },
    {
      label: 'Task Type',
      value: 'taskType' as SliceType,
      icon: 'check_circle',
    },
  ]

  const sliceOptions = defaultSliceOptions.filter(
    (option) => !sliceFields.length || sliceFields.includes(option.value),
  )

  const [isLoading, setIsLoading] = useState(false)

  // project info
  const {
    project,
    getStatuses,
    getTypes,
    getTaskTypes,
    isLoading: isLoadingProject,
  } = useProjectAnatomySlices({ projectName })

  //   Hierarchy
  const { getData: getHierarchyData, isLoading: isLoadingHierarchy } = useHierarchyTable({
    projectName: projectName || '',
    folderTypes: project?.folderTypes || [],
  })
  //   Users
  const { getData: getUsersData, isLoading: isUsersLoading } = useUsersTable({ projectName })

  const builtInSlices: Record<SliceType, SliceData> = {
    hierarchy: {
      getData: getHierarchyData,
      isLoading: isLoadingHierarchy,
      isExpandable: true,
    },
    users: {
      getData: getUsersData,
      isLoading: isUsersLoading,
      isExpandable: false,
    },
    status: {
      getData: getStatuses,
      isLoading: isLoadingProject,
      isExpandable: false,
    },
    type: {
      getData: getTypes,
      isLoading: isLoadingProject,
      isExpandable: true,
    },
    taskType: {
      getData: getTaskTypes,
      isLoading: isLoadingProject,
      isExpandable: false,
    },
  }

  const initSlice = { data: [], isExpandable: false }
  const [slice, setSlice] = useState<Slice>(initSlice)

  useEffect(() => {
    // wait for hierarchy data to load before fetching slice data
    if (isLoadingHierarchy) return
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const newData = await builtInSlices[sliceType].getData()
        setSlice({
          data: newData,
          isExpandable: builtInSlices[sliceType].isExpandable,
        })
      } catch (error) {
        console.error('Error fetching slice data:', error)
        setSlice(initSlice)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [sliceType, projectName, isLoadingHierarchy])

  return {
    sliceOptions,
    table: slice,
    isLoading: builtInSlices[sliceType].isLoading || isLoading,
    sliceType,
    handleSliceTypeChange: onSliceTypeChange,
  }
}

export default useTableDataBySlice
