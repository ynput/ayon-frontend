import { useAppSelector } from '@state/store'
import { useEffect, useMemo, useState } from 'react'
import { useHierarchyTable } from '@shared/hooks'
import useUsersTable from './useUsersTable'
import useProjectAnatomySlices from './useProjectAnatomySlices'
import { Slice, SliceData, SliceTypeField, TableData } from '../types'
import { SimpleTableRow } from '@shared/containers/SimpleTable'
import { SliceType } from '@shared/containers/Slicer'
import { useSlicerContext } from '@context/SlicerContext'
import useSlicerAttributesData from './useSlicerAttributesData'
import { getAttributeIcon, getEntityTypeIcon } from '@shared/util'

interface TableDataBySliceProps {
  sliceFields: SliceTypeField[]
  entityTypes?: string[] // entity types
}

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

const useTableDataBySlice = ({
  sliceFields,
  entityTypes = [],
}: TableDataBySliceProps): TableData => {
  const { sliceType, onSliceTypeChange, useExtraSlices } = useSlicerContext()
  const projectName = useAppSelector((state) => state.project.name)
  const { formatAttribute } = useExtraSlices()

  const defaultSliceOptions: SliceTypeField[] = [
    {
      label: 'Hierarchy',
      value: 'hierarchy' as SliceType,
      icon: 'table_rows',
    },
    {
      label: 'Assignee',
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
      icon: getEntityTypeIcon('task'),
    },
    {
      label: 'Folder Type',
      value: 'taskType' as SliceType,
      icon: getEntityTypeIcon('folder'),
    },
    {
      label: 'Product Type',
      value: 'productType' as SliceType,
      icon: getEntityTypeIcon('product'),
    },
    {
      label: 'Author',
      value: 'author' as SliceType,
      icon: 'attribution',
    },
  ]

  const sliceOptions = sliceFields
    .filter((f) => defaultSliceOptions.some((o) => o.value === f.value))
    .map((field) => {
      const defaultOption = defaultSliceOptions.find((opt) => opt.value === field.value)
      // use default option as fallback data
      return {
        ...defaultOption,
        ...field,
      }
    })

  const showAttributes = sliceFields.some((field) => field.value === 'attributes')
  const { attributes: slicerAttribs, isLoading: isLoadingAttribs } = useSlicerAttributesData({
    entityTypes,
  })

  if (showAttributes && typeof formatAttribute === 'function') {
    slicerAttribs.forEach((attr) =>
      sliceOptions.push({
        label: attr.data.title || attr.name,
        value: 'attrib.' + attr.name,
        icon: getAttributeIcon(attr.name, attr.data.type, Boolean(attr.data.enum)),
      }),
    )
  }

  const [isLoading, setIsLoading] = useState(false)

  // project info
  const {
    project,
    getStatuses,
    getTypes,
    getTaskTypes,
    getProductTypes,
    getAttribute,
    isLoading: isLoadingProject,
  } = useProjectAnatomySlices({ scopes: entityTypes, useExtraSlices })

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
    author: {
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
    productType: {
      getData: getProductTypes,
      isLoading: false,
      isExpandable: false,
    },
  }

  for (const attrib of slicerAttribs) {
    builtInSlices['attrib.' + attrib.name] = {
      getData: () => getAttribute(attrib),
      isLoading: isLoadingAttribs,
      isExpandable: false,
      isAttribute: true,
    }
  }

  const initSlice = { data: [], isExpandable: false }
  const [slice, setSlice] = useState<Slice>(initSlice)
  const sliceConfig = builtInSlices[sliceType]

  const handleSliceTypeChange = (
    sliceType: SliceType,
    leavePersistentSlice: boolean,
    returnToPersistentSlice: boolean,
  ) => {
    // get slice data object
    const sliceConfig = builtInSlices[sliceType]
    if (!sliceConfig) {
      console.warn(`Slice type ${sliceType} not found`)
      return
    }
    // check slice type is enabled
    if (
      (sliceConfig.isAttribute && showAttributes) ||
      sliceFields.some((field) => field.value === sliceType)
    ) {
      onSliceTypeChange(sliceType, leavePersistentSlice, returnToPersistentSlice)
    }
  }

  useEffect(() => {
    // wait for hierarchy data to load before fetching slice data
    if (isLoadingData) return

    const fetchData = async () => {
      try {
        if (!sliceConfig) return
        setIsLoading(true)
        const newData = await sliceConfig.getData()

        if (newData === undefined) {
          window.alert(
            'Slice options failed to load. This likely means the PowerFeatures addon is out of date. Please update to the latest version.',
          )
          // setSlice type to hierarchy
          onSliceTypeChange('hierarchy', false, false)
          throw new Error('Slice data is undefined')
        }

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
        // set to initial empty state
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
    isLoading:
      (builtInSlices[sliceType] && builtInSlices[sliceType].isLoading) ||
      isLoading ||
      isLoadingData,
    sliceType,
    handleSliceTypeChange,
  }
}

export default useTableDataBySlice
