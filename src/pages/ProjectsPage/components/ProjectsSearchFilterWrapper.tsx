import { FC, useState, useEffect, useRef } from 'react'
import { Filter, Option, SearchFilter, SearchFilterRef } from '@ynput/ayon-react-components'
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import {
  clientFilterToQueryFilter,
  queryFilterToClientFilter,
} from '@shared/containers/ProjectTreeTable'
import { useBuildProjectFilterOptions } from '../hooks/useBuildProjectFilterOptions'
import { useDateRangeFilter, CustomDateRangeDialog } from '@shared/components/SearchFilter'

interface ProjectsSearchFilterWrapperProps {
  queryFilters: QueryFilter
  onChange: (queryFilter: QueryFilter) => void
}

const ProjectsSearchFilterWrapper: FC<ProjectsSearchFilterWrapperProps> = ({
  queryFilters,
  onChange,
}) => {
  const options = useBuildProjectFilterOptions()
  const filters = queryFilterToClientFilter(queryFilters, options)
  const [localFilters, setLocalFilters] = useState<Filter[]>(filters)
  const searchFilterRef = useRef<SearchFilterRef>(null)

  const dateRange = useDateRangeFilter()

  useEffect(() => {
    setLocalFilters(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)])

  const handleFilterChange = (newFilters: Filter[]) => {
    dateRange.wrapFilterChange(newFilters, localFilters, setLocalFilters)
  }

  const handleFinish = (newFilters: Filter[]) => {
    onChange(clientFilterToQueryFilter(newFilters))
  }

  return (
    <>
      <SearchFilter
        ref={searchFilterRef}
        options={options as Option[]}
        filters={localFilters}
        onChange={handleFilterChange}
        onFinish={handleFinish}
        enableMultipleSameFilters={false}
        enableGlobalSearch={true}
        enableAutosuggestion={true}
        pt={{
          searchBar: {
            onClickCapture: (e) => dateRange.handleSearchBarClickCapture(e, localFilters),
          },
          dropdown: {
            pt: {
              item: {
                onClick: (e) => dateRange.handleDropdownItemClick(e, localFilters, options),
              },
            },
          },
        }}
      />
      <CustomDateRangeDialog
        isOpen={!!dateRange.customRangeFilterId}
        header={
          options.find((o) => o.id === dateRange.customRangeFilterId?.split('__')[0])?.label ??
          'Custom range'
        }
        startDate={dateRange.customStartDate}
        endDate={dateRange.customEndDate}
        onStartDateChange={dateRange.setCustomStartDate}
        onEndDateChange={dateRange.setCustomEndDate}
        onApply={() =>
          dateRange.handleCustomRangeApply(localFilters, options, handleFinish, searchFilterRef)
        }
        onClose={dateRange.handleCustomRangeClose}
      />
    </>
  )
}

export default ProjectsSearchFilterWrapper
