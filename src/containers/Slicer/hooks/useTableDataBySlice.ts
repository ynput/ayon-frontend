import { useAppSelector } from '@state/store'
import { useEffect, useMemo, useState } from 'react'
import useHierarchyTable from './useHierarchyTable'
import useUsersTable from './useUsersTable'
import useProjectAnatomySlices from './useProjectAnatomySlices'
import { Slice, SliceData, SliceOption, TableData } from '../types'
import { SimpleTableRow } from '@shared/SimpleTable'
import { SliceType } from '@shared/containers/Slicer'
import { useSlicerContext } from '@context/SlicerContext'

interface Props {
  sliceFields: SliceType[]
}

const defaultSliceOptions: SliceOption[] = [
  {
    label: 'Hierarchy',
    value: 'hierarchy' as SliceType,
    icon: 'table_rows',
  },
  {
    label: 'Assignees',
    value: 'assignees' as SliceType,
    icon: 'person',
  },
  {
    label: 'Status',
    value: 'status' as SliceType,
    icon: 'arrow_circle_right',
  },
  {
    label: 'Task Type',
    value: 'taskType' as SliceType,
    icon: 'check_circle',
  },
]

const getNoValue = (field: string): SimpleTableRow => ({
  id: 'noValue',
  name: 'noValue',
  label: `No ${field}`,
  icon: 'unpublished',
  subRows: [],
  data: {
    id: 'noValue',
  },
})

const getSomeValue = (field: string): SimpleTableRow => ({
  id: 'hasValue',
  name: 'hasValue',
  label: `Some ${field}`,
  icon: 'check',
  subRows: [],
  data: {
    id: 'hasValue',
  },
})

const useTableDataBySlice = ({ sliceFields }: Props): TableData => {
  const { sliceType, onSliceTypeChange, useExtraSlices } = useSlicerContext()
  const projectName = useAppSelector((state) => state.project.name)

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
  } = useProjectAnatomySlices({ projectName, useExtraSlices })

  //   Hierarchy
  const { getData: getHierarchyData, isFetching: isLoadingHierarchy } = useHierarchyTable({
    projectName: projectName || '',
    folderTypes: project?.folderTypes || [],
  })
  //   Users
  const { getData: getUsersData, isLoading: isUsersLoading } = useUsersTable({
    projectName,
    useExtraSlices,
  })
  const isLoadingData = isLoadingHierarchy || isLoadingProject || isUsersLoading

  const builtInSlices: Record<SliceType, SliceData> = {
    hierarchy: {
      getData: getHierarchyData,
      isLoading: isLoadingHierarchy,
      isExpandable: true,
    },
    assignees: {
      getData: getUsersData,
      isLoading: isUsersLoading,
      isExpandable: false,
      noValue: true,
      hasValue: true,
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
  const sliceConfig = builtInSlices[sliceType]

  const handleSliceTypeChange = (
    sliceType: SliceType,
    leavePersistentSlice: boolean,
    returnToPersistentSlice: boolean,
  ) => {
    // check slice type is enabled
    if (sliceFields.includes(sliceType)) {
      onSliceTypeChange(sliceType, leavePersistentSlice, returnToPersistentSlice)
    }
  }

  useEffect(() => {
    // wait for hierarchy data to load before fetching slice data
    if (isLoadingData) return

    // check if slice field is enabled
    if (!sliceFields.includes(sliceType)) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const newData = await sliceConfig.getData()

        // add some value option
        if (sliceConfig.hasValue) newData.unshift(getSomeValue(sliceType))

        // add no value option
        if (sliceConfig.noValue) newData.unshift(getNoValue(sliceType))
        setSlice({
          data: newData,
          isExpandable: sliceConfig.isExpandable,
        })
      } catch (error) {
        console.error('Error fetching slice data:', error)
        setSlice(initSlice)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [sliceType, getHierarchyData, sliceFields, projectName, isLoadingData])

  // from slice data, flatten into a map of ids to rows
  const sliceMap = useMemo(() => {
    const map = new Map<string, SimpleTableRow>()
    const queue: SimpleTableRow[] = [...slice.data]

    while (queue.length > 0) {
      const row = queue.shift()
      if (row) {
        map.set(row.id, row)
        if (row.subRows && row.subRows.length > 0) {
          for (const subRow of row.subRows) {
            queue.push(subRow)
          }
        }
      }
    }
    return map
  }, [slice.data])

  return {
    sliceOptions,
    table: slice,
    sliceMap,
    isLoading: builtInSlices[sliceType].isLoading || isLoading || isLoadingData,
    sliceType,
    handleSliceTypeChange,
  }
}

export default useTableDataBySlice
