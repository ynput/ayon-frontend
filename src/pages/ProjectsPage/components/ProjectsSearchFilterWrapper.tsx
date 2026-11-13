import { FC, useState, useEffect, useRef } from 'react'
import { Filter, Option, SearchFilter, SearchFilterRef } from '@ynput/ayon-react-components'
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import {
  clientFilterToQueryFilter,
  queryFilterToClientFilter,
} from '@shared/containers/ProjectTreeTable'
import {
  AdvancedFilterDropdownButton,
  AdvancedFilterMoveButton,
  AdvancedFilterSlot,
  useAdvancedFilterInSearchBar,
} from '@shared/components'
import type { UpdateAdvancedFilter } from '@shared/containers'
import { useBuildProjectFilterOptions } from '../hooks/useBuildProjectFilterOptions'
import { useProjectAdvancedFilterOptions } from '../hooks/useProjectAdvancedFilterOptions'
import { useDateRangeFilter, CustomDateRangeDialog } from '@shared/components/SearchFilter'

interface ProjectsSearchFilterWrapperProps {
  queryFilters: QueryFilter
  onChange: (queryFilter: QueryFilter) => void
  // nested filter next to the search bar: shown when onAdvancedFilterChange is given
  advancedFilter?: QueryFilter
  onAdvancedFilterChange?: UpdateAdvancedFilter
}

const ProjectsSearchFilterWrapper: FC<ProjectsSearchFilterWrapperProps> = ({
  queryFilters,
  onChange,
  advancedFilter,
  onAdvancedFilterChange,
}) => {
  const options = useBuildProjectFilterOptions()
  const advancedOptions = useProjectAdvancedFilterOptions(options)
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

  const advancedFilterBar = useAdvancedFilterInSearchBar({
    value: advancedFilter,
    onChange: onAdvancedFilterChange,
    options: advancedOptions as Option[],
    filters: localFilters,
    // as Confirm does: close() alone would drop the values picked so far
    applySearchBar: () => {
      const applied = localFilters.filter((f) => f.values?.length)
      setLocalFilters(applied)
      handleFinish(applied)
      searchFilterRef.current?.close()
    },
    removeFilters: (ids) => {
      const kept = localFilters.filter((f) => !ids.includes(f.id))
      setLocalFilters(kept)
      searchFilterRef.current?.close()
      return clientFilterToQueryFilter(kept)
    },
  })

  return (
    <>
      <SearchFilter
        ref={searchFilterRef}
        options={
          (advancedFilterBar.option ? [...options, advancedFilterBar.option] : options) as Option[]
        }
        filters={localFilters}
        onChange={handleFilterChange}
        onFinish={handleFinish}
        enableMultipleSameFilters={false}
        enableGlobalSearch={true}
        enableAutosuggestion={false}
        pt={{
          searchBar: {
            onClickCapture: (e) => dateRange.handleSearchBarClickCapture(e, localFilters),
          },
          dropdown: {
            operationsTemplate: onAdvancedFilterChange && (
              <AdvancedFilterDropdownButton
                editor={advancedFilterBar.editor}
                onSwitch={advancedFilterBar.switchFilter}
              />
            ),
            pt: {
              item: {
                onClick: (e) =>
                  advancedFilterBar.handleItemClick(e) &&
                  dateRange.handleDropdownItemClick(e, localFilters, options),
              },
            },
          },
        }}
      />
      <AdvancedFilterMoveButton
        searchFilterRef={searchFilterRef}
        count={advancedFilterBar.movableCount}
        onMove={advancedFilterBar.moveToAdvancedFilter}
      />
      {onAdvancedFilterChange && (
        <AdvancedFilterSlot
          value={advancedFilter}
          onChange={onAdvancedFilterChange}
          editor={advancedFilterBar.editor}
          fields={advancedFilterBar.fields}
          openRequest={advancedFilterBar.openRequest}
        />
      )}
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
