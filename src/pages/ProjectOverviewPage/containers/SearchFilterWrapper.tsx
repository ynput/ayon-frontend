import styled from 'styled-components'
import { BuildFilterOptions, useBuildFilterOptions, ScopeWithFilterTypes } from '@shared/components'
import { FC, useMemo, useState, useEffect, useRef } from 'react'
import {
  Dialog,
  Filter,
  FormRow,
  Icon,
  InputDate,
  SaveButton,
  SearchFilter,
  SearchFilterProps,
  SearchFilterRef,
  SEARCH_FILTER_ID,
} from '@ynput/ayon-react-components'
import { EditorTaskNode, TaskNodeMap } from '@shared/containers/ProjectTreeTable'
import AdvancedFiltersPlaceholder from '@components/SearchFilter/AdvancedFiltersPlaceholder'
import { ProjectModelWithProducts, usePowerpack } from '@shared/context'
import { useColumnSettingsContext } from '@shared/containers/ProjectTreeTable'
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import {
  queryFilterToClientFilter,
  clientFilterToQueryFilter,
} from '@shared/containers/ProjectTreeTable/utils'
import { CUSTOM_RANGE_ID } from '@shared/components/SearchFilter/filterDates'
import { startOfDay, endOfDay, format } from 'date-fns'

const DialogBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

interface SearchFilterWrapperProps
  extends Omit<BuildFilterOptions, 'scope' | 'scopes' | 'data' | 'power'>,
    Omit<SearchFilterProps, 'options' | 'onFinish' | 'filters' | 'onChange'> {
  projectInfo?: ProjectModelWithProducts
  tasksMap?: TaskNodeMap
  scope?: BuildFilterOptions['scope']
  scopes?: ScopeWithFilterTypes[]
  queryFilters?: QueryFilter
  onChange?: (queryFilters: QueryFilter) => void
  data: BuildFilterOptions['data']
}

const SearchFilterWrapper: FC<SearchFilterWrapperProps> = ({
  queryFilters,
  onChange,
  data: customData,
  filterTypes,
  projectNames,
  disabledFilters,
  projectInfo,
  tasksMap,
  scope,
  scopes,
  config,
  pt,
  ...props
}) => {
  const { columnOrder } = useColumnSettingsContext()

  // create a flat list of all the assignees (string[]) on all tasks (duplicated)
  // this is used to rank what assignees are shown in the filter first
  const allAssignees: string[] = useMemo(
    () =>
      tasksMap
        ? Array.from(tasksMap.values()).flatMap((task: EditorTaskNode) => task.assignees)
        : [],
    [tasksMap],
  )

  // build the data for the suggested options
  const data: BuildFilterOptions['data'] = {
    assignees: allAssignees,
    tags: projectInfo?.tags?.map((t) => t.name) || [],
    productTypes: projectInfo?.productTypes,
    ...customData,
    // TODO: find a way of getting all attribute values when all tasks are not loaded
  }

  const { setPowerpackDialog, powerLicense } = usePowerpack()
  const handlePowerClick = () => {
    setPowerpackDialog('advancedFilters')
    return false
  }

  const options = useBuildFilterOptions({
    filterTypes,
    projectNames,
    scope,
    scopes,
    data,
    columnOrder,
    config: {
      enableExcludes: powerLicense,
      enableOperatorChange: powerLicense,
      enableRelativeValues: true,
      prefixes: { attributes: 'attrib.' },
      ...config,
    },
    power: powerLicense,
  })

  // Convert QueryFilter to Filter[] for internal use
  const filters = queryFilterToClientFilter(queryFilters, options)

  // keeps track of the filters whilst adding/removing filters
  const [localFilters, setLocalFilters] = useState<Filter[]>(filters)

  const searchFilterRef = useRef<SearchFilterRef>(null)

  // Custom date range picker state
  const [customRangeFilterId, setCustomRangeFilterId] = useState<string | null>(null)
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  // Track which datetime filter the user is currently interacting with
  const activeDatetimeFilterRef = useRef<string | null>(null)

  useEffect(() => {
    setLocalFilters(filters)
  }, [JSON.stringify(filters)]) // Update filters when filters change

  // Track the active datetime filter from onChange events
  const handleFilterChange = (newFilters: Filter[]) => {
    // Track the most recently added/modified datetime filter
    const datetimeFilter = newFilters.find(
      (f) => f.type === 'datetime' && !localFilters.some((lf) => lf.id === f.id),
    )
    if (datetimeFilter) {
      activeDatetimeFilterRef.current = datetimeFilter.id
    }

    // Strip any custom-range values that might slip through, but keep empty datetime
    // filters so SearchFilter can maintain its intermediate state (user selected the
    // filter type but hasn't picked a preset yet)
    const cleanedFilters = newFilters.map((f) => {
      if (f.type === 'datetime' && f.values?.some((v) => v.id === CUSTOM_RANGE_ID)) {
        return {
          ...f,
          values: f.values?.filter((v) => v.id !== CUSTOM_RANGE_ID),
        }
      }
      return f
    })

    validateFilters(cleanedFilters, setLocalFilters)
  }

  const handleCustomRangeApply = () => {
    if (!customRangeFilterId || !customStartDate || !customEndDate) return

    const baseFilterId = customRangeFilterId.split('__')[0]
    const filterOption = options.find((o) => o.id === baseFilterId)
    if (!filterOption) return

    const start = startOfDay(new Date(customStartDate))
    const end = endOfDay(new Date(customEndDate))

    const dateValue = {
      id: `custom-${start.toISOString()}-${end.toISOString()}`,
      label: `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`,
      values: [
        { id: start.toISOString(), label: format(start, 'MMM d, yyyy') },
        { id: end.toISOString(), label: format(end, 'MMM d, yyyy') },
      ],
    }

    const newFilter: Filter = {
      id: customRangeFilterId,
      type: 'datetime',
      label: filterOption.label,
      icon: filterOption.icon,
      values: [dateValue],
      singleSelect: true,
    }

    const updatedFilters = [
      ...localFilters.filter((f) => f.id !== customRangeFilterId),
      newFilter,
    ]

    handleFinish(updatedFilters)

    setCustomRangeFilterId(null)
    setCustomStartDate('')
    setCustomEndDate('')

    // Close the SearchFilter dropdown
    searchFilterRef.current?.close()
  }

  const handleCustomRangeClose = () => {
    setCustomRangeFilterId(null)
    setCustomStartDate('')
    setCustomEndDate('')
  }

  // Find which datetime filter the custom-range click belongs to
  const findActiveDatetimeFilterId = (): string | null => {
    // First check the ref (set when a new datetime filter was added)
    if (activeDatetimeFilterRef.current) {
      return activeDatetimeFilterRef.current
    }

    // Fallback: find the first datetime filter option that exists
    const datetimeOptions = options.filter((o) => o.type === 'datetime')
    if (datetimeOptions.length === 1) {
      return datetimeOptions[0].id
    }

    // If multiple datetime options, check which one is currently selected in localFilters
    const activeDatetime = localFilters.find(
      (f) => f.type === 'datetime' && (!f.values || f.values.length === 0),
    )
    if (activeDatetime) {
      return activeDatetime.id
    }

    // Last resort: return the first datetime option
    return datetimeOptions[0]?.id || null
  }

  const validateFilters = (filters: Filter[], callback: (filters: Filter[]) => void) => {
    // if a filter is a date then check we have power features
    const invalidFilters = filters.filter((f) => f.type === 'datetime' && !powerLicense)
    let validFilters = filters.filter((f) => f.type !== 'datetime' || powerLicense)
    if (invalidFilters.length) {
      setPowerpackDialog('advancedFilters')
    }

    // Merge multiple text search filters (SEARCH_FILTER_ID) into one filter
    const searchFilters = validFilters.filter((f) => f.id.startsWith(SEARCH_FILTER_ID))
    if (searchFilters.length > 1) {
      // Collect all values and dedupe by id
      const mergedValuesRaw = searchFilters.flatMap((f) => f.values || [])
      const mergedValues = Array.from(
        new Map(mergedValuesRaw.map((v) => [String((v as any).id), v])).values(),
      )

      // Create merged filter; set id to the canonical SEARCH_FILTER_ID so downstream logic treats it as the search filter
      const mergedFilter = { ...searchFilters[0], id: SEARCH_FILTER_ID, values: mergedValues }

      // keep all non-search filters (match any variant that startsWith SEARCH_FILTER_ID) and append the merged search filter
      const nonSearch = validFilters.filter((f) => !f.id.startsWith(SEARCH_FILTER_ID))
      validFilters = [...nonSearch, mergedFilter]
    }

    callback(validFilters)
  }

  const handleFinish = (filters: Filter[]) => {
    validateFilters(filters, (validFilters) => {
      // Convert Filter[] back to QueryFilter and call onChange
      const queryFilter = clientFilterToQueryFilter(validFilters)
      onChange?.(queryFilter)
    })
  }

  const { dropdown, searchBar, ...ptRest } = pt || {}

  return (
    <>
      <SearchFilter
        ref={searchFilterRef}
        options={options}
        filters={localFilters}
        onChange={handleFilterChange}
        onFinish={handleFinish} // when changes are applied
        enableMultipleSameFilters={false}
        enableGlobalSearch={true}
        disabledFilters={disabledFilters}
        pt={{
          searchBar: {
            style: {
              paddingRight: 28,
            },
            ...searchBar,
          },
          dropdown: {
            operationsTemplate: powerLicense ? undefined : (
              <AdvancedFiltersPlaceholder onClick={handlePowerClick} />
            ),
            pt: {
              item: {
                onClick: (event) => {
                  const listItem = (event.target as HTMLLIElement).closest('li')
                  if (!listItem) return true

                  // PowerPack gating
                  if (listItem.querySelector('span[icon="bolt"]')) {
                    return handlePowerClick()
                  }

                  // Custom range: intercept click and open date picker instead
                  if (listItem.querySelector('span[icon="tune"]')) {
                    const filterId = findActiveDatetimeFilterId()
                    if (filterId) {
                      setCustomRangeFilterId(filterId)
                    }
                    return false // prevent SearchFilter from selecting this value
                  }

                  return true
                },
              },
              hasNoOption: {
                contentAfter: powerLicense ? undefined : <Icon icon="bolt" />,
              },
              hasSomeOption: {
                contentAfter: powerLicense ? undefined : <Icon icon="bolt" />,
              },
            },
            ...dropdown,
          },
          ...ptRest,
        }}
        {...props}
      />
      <Dialog
        isOpen={!!customRangeFilterId}
        onClose={handleCustomRangeClose}
        header={options.find((o) => o.id === customRangeFilterId?.split('__')[0])?.label || 'Custom range'}
        size="sm"
        hideCancelButton
        footer={
          <SaveButton
            label="Confirm"
            icon="check"
            onClick={handleCustomRangeApply}
            active={!!customStartDate && !!customEndDate}
          />
        }
      >
        <DialogBody>
          <FormRow label="Start date">
            <InputDate
              /* @ts-ignore - InputDate extends ReactDatePickerProps but types don't resolve cleanly */
              selected={customStartDate ? new Date(customStartDate) : undefined}
              onChange={(date: Date | null) => setCustomStartDate(date ? format(date, 'yyyy-MM-dd') : '')}
              autoFocus
            />
          </FormRow>
          <FormRow label="End date">
            <InputDate
              /* @ts-ignore - InputDate extends ReactDatePickerProps but types don't resolve cleanly */
              selected={customEndDate ? new Date(customEndDate) : undefined}
              onChange={(date: Date | null) => setCustomEndDate(date ? format(date, 'yyyy-MM-dd') : '')}
            />
          </FormRow>
        </DialogBody>
      </Dialog>
    </>
  )
}

export default SearchFilterWrapper
