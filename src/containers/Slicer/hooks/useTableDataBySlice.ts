import { useAppSelector } from '@state/store'
import { useEffect, useState } from 'react'
import useHierarchyTable from './useHierarchyTable'
import { useGetProjectQuery } from '@queries/project/getProject'
import useUsersTable from './useUsersTable'
import { TableRow } from '../SlicerTable'
import { DropdownProps } from '@ynput/ayon-react-components'

interface Props {
  projectName?: string
}

export type SliceType = 'hierarchy' | 'users'

type SliceOption = DropdownProps['options'][0] & { value: SliceType }

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

const useTableDataBySlice = ({ projectName: propProjectName }: Props): TableData => {
  const projectName = useAppSelector((state) => state.project.name) || propProjectName

  const [sliceType, setSliceType] = useState<SliceType>('hierarchy')

  const initSliceOptions: SliceOption[] = [
    {
      label: 'Hierarchy',
      value: 'hierarchy',
    },
    {
      label: 'Users',
      value: 'users',
    },
  ]
  const [sliceOptions, setSliceOptions] = useState<SliceOption[]>(initSliceOptions)

  const [isLoading, setIsLoading] = useState(false)

  // project info
  const { data: project } = useGetProjectQuery(
    { projectName: projectName || '' },
    { skip: !projectName },
  )

  const {
    data: hierarchyData = [],
    getData: getHierarchyData,
    isLoading: isLoadingHierarchy,
  } = useHierarchyTable({
    projectName: projectName || '',
    folderTypes: project?.folderTypes || [],
  })

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
