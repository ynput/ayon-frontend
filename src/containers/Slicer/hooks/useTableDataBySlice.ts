import { useAppSelector } from '@state/store'
import { useEffect, useState } from 'react'
import useHierarchyTable from './useHierarchyTable'
import useUsersTable from './useUsersTable'
import { TableRow } from '../SlicerTable'
import useProjectAnatomySlices from './useProjectAnatomySlices'

interface Props {
  sliceFields: SliceType[]
}

export type SliceType = 'hierarchy' | 'users' | 'status' | 'type'

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
  handleSliceChange: (slice: SliceType) => Promise<void>
}

const useTableDataBySlice = ({ sliceFields }: Props): TableData => {
  const projectName = useAppSelector((state) => state.project.name)

  const [sliceType, setSliceType] = useState<SliceType>('hierarchy')

  const defaultSliceOptions: SliceOption[] = [
    {
      label: 'Hierarchy',
      value: 'hierarchy' as SliceType,
      icon: 'table_rows',
    },
    {
      label: 'Users',
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
      value: 'type' as SliceType,
      icon: 'folder',
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
    isLoading: isLoadingProject,
  } = useProjectAnatomySlices({ projectName })

  //   Hierarchy
  const {
    data: hierarchyData = [],
    getData: getHierarchyData,
    isLoading: isLoadingHierarchy,
  } = useHierarchyTable({
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
  }

  const initSlice = { data: [], isExpandable: false }
  const [slice, setSlice] = useState<Slice>(initSlice)

  const handleSliceChange = async (newSlice: SliceType) => {
    try {
      setSliceType(newSlice)
    } catch (error) {
      console.error('Error changing slice:', error)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const sliceConfig = builtInSlices[sliceType]
        const newData = await sliceConfig.getData()
        const newSlice = { data: newData, isExpandable: sliceConfig.isExpandable }
        setSlice(newSlice)
        setIsLoading(false)
      } catch (error) {
        setIsLoading(false)
        console.error('Error fetching slice data:', error)
        setSlice(initSlice)
      }
    }
    fetchData()
  }, [sliceType, hierarchyData, projectName])

  return {
    sliceOptions,
    table: slice,
    isLoading: builtInSlices[sliceType].isLoading || isLoading,
    sliceType,
    handleSliceChange,
  }
}

export default useTableDataBySlice
