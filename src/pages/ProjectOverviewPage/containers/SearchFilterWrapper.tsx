import { BuildFilterOptions, useBuildFilterOptions, ScopeWithFilterTypes } from '@shared/components'
import { FC, useMemo, useState, useEffect, useRef } from 'react'
import {
  Filter,
  Icon,
  SearchFilter,
  SearchFilterProps,
  SearchFilterRef,
  SEARCH_FILTER_ID,
  buildFilterId,
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
import { useDateRangeFilter, CustomDateRangeDialog } from '@shared/components/SearchFilter'
import { detectRelativeDatePattern } from '@shared/components/SearchFilter/filterDates'

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

  // Custom date range
  const dateRange = useDateRangeFilter()

  // Track which datetime filter the user is currently interacting with
  const lastInteractedFilterRef = useRef<string | null>(null)

  // Active search-chip edit: set when user clicks a search chip to edit it.
  // The dropdown opens in edit mode; our Enter interceptor updates/removes the chip.
  const editingSearchChipRef = useRef<string | null>(null)

  // Mirror of localFilters for use inside async DOM event handlers (keydown on
  // the dropdown input) that need the latest filters without stale closures.
  const localFiltersRef = useRef<Filter[]>(localFilters)
  localFiltersRef.current = localFilters

  useEffect(() => {
    setLocalFilters(filters)
  }, [JSON.stringify(filters)]) // Update filters when filters change

  // Track the active datetime filter from onChange events
  const handleFilterChange = (newFilters: Filter[]) => {
    // Check if a relative date filter is being clicked to edit it
    // If so, auto-open the edit dialog instead of allowing dropdown
    const modifiedDatetimeFilter = newFilters.find(
      (f) => f.type === 'datetime' && f.id !== lastInteractedFilterRef.current,
    )
    if (
      modifiedDatetimeFilter &&
      modifiedDatetimeFilter.values &&
      modifiedDatetimeFilter.values.length > 0
    ) {
      const rangeValue = modifiedDatetimeFilter.values[0]
      if (rangeValue.id && rangeValue.id.startsWith('custom-')) {
        // This is a custom date range — check if it matches a relative pattern
        const idParts = rangeValue.id.replace('custom-', '')
        const firstEndIndex = idParts.indexOf('Z')
        if (firstEndIndex > 0) {
          const startISO = idParts.substring(0, firstEndIndex + 1)
          const endISO = idParts.substring(firstEndIndex + 2)
          const relativePattern = detectRelativeDatePattern(startISO, endISO)

          if (relativePattern) {
            // It's a relative date — auto-open edit dialog
            handleOpenCustomRangeForFilter(modifiedDatetimeFilter.id)
            lastInteractedFilterRef.current = modifiedDatetimeFilter.id
            return
          }
        }
      }
    }
    lastInteractedFilterRef.current = null

    dateRange.wrapFilterChange(newFilters, localFilters, (cleaned) =>
      validateFilters(cleaned, setLocalFilters),
    )
  }

  const handleCustomRangeApply = () =>
    dateRange.handleCustomRangeApply(localFilters, options, handleFinish, searchFilterRef)

  const handleCustomRangeClose = () => dateRange.handleCustomRangeClose()

  const handleOpenCustomRangeForFilter = (filterId: string) =>
    dateRange.openCustomRangeForFilter(filterId, localFilters)

  const validateFilters = (filters: Filter[], callback: (filters: Filter[]) => void) => {
    let validFilters = [...filters]

    // Expand comma-separated custom values into individual values so pasted lists
    // from spreadsheets (newlines/tabs are normalised to commas on paste) become
    // multiple OR-ed conditions rather than a single LIKE on the joined string.
    validFilters = validFilters.map((f) => {
      if (!f.values?.length) return f
      const expanded = f.values.flatMap((v) => {
        const id = (v as any).id
        const isCustom = (v as any).isCustom === true
        if (!isCustom || typeof id !== 'string' || !id.includes(',')) return [v]
        return id
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((p) => ({ ...(v as any), id: p, label: p }))
      })
      const deduped = Array.from(new Map(expanded.map((v) => [String((v as any).id), v])).values())
      return { ...f, values: deduped }
    })

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
    // Dropdown closed (or filters committed) — search-chip edit session ends
    editingSearchChipRef.current = null
    validateFilters(filters, (validFilters) => {
      // Convert Filter[] back to QueryFilter and call onChange
      const queryFilter = clientFilterToQueryFilter(validFilters)
      onChange?.(queryFilter)
    })
  }

  const { dropdown, searchBar, ...ptRest } = pt || {}

  // Spreadsheet paste: replace newlines/tabs with commas so the list becomes
  // multiple OR-ed values (downstream split happens in validateFilters and the
  // auto-fill onClick path). The input is React-controlled, so we preventDefault
  // and inject via the native setter to trigger its onChange.
  const handleDropdownPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (!(target instanceof HTMLInputElement)) return
    const text = e.clipboardData?.getData('text') ?? ''
    if (!/[\r\n\t]/.test(text)) return
    e.preventDefault()
    e.stopPropagation()

    const normalized = text
      .replace(/[\r\n\t]+/g, ',')
      .replace(/,+/g, ',')
      .replace(/^,|,$/g, '')

    const input = target
    const start = input.selectionStart ?? input.value.length
    const end = input.selectionEnd ?? input.value.length
    const newValue = input.value.slice(0, start) + normalized + input.value.slice(end)

    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    if (nativeSetter) {
      nativeSetter.call(input, newValue)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }

    const caret = start + normalized.length
    input.setSelectionRange(caret, caret)
  }

  // Set the dropdown search input value via native setter to trigger React's
  // controlled onChange inside SearchFilterDropdown
  const prefillDropdownSearch = (text: string) => {
    const container = searchFilterRef.current?.getContainerElement()
    const input = container?.querySelector('ul .search input') as HTMLInputElement | null
    if (!input) return
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    if (nativeSetter) {
      nativeSetter.call(input, text)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
    input.focus()
    input.select()
  }

  // Commit the current dropdown input value to the chip being edited.
  // Empty input removes the chip; non-empty input replaces its single value.
  const commitSearchChipEdit = (chipId: string, input: HTMLInputElement) => {
    const text = input.value.trim()
    const currentFilters = localFiltersRef.current
    if (!text) {
      handleFinish(currentFilters.filter((f) => f.id !== chipId))
    } else {
      const updated = currentFilters.map((f) =>
        f.id === chipId ? { ...f, values: [{ id: text, label: text }] } : f,
      )
      handleFinish(updated)
    }
    editingSearchChipRef.current = null
    searchFilterRef.current?.close()
  }

  // While editing a search chip, intercept Enter on the dropdown input AND clicks
  // on the dropdown's Confirm button so the chip's value gets updated (or removed
  // if cleared). Without these intercepts the default Confirm path passes the
  // chip's original values to onConfirmAndClose, discarding the typed edit.
  const attachSearchEditCommitHandlers = (chipId: string) => {
    const container = searchFilterRef.current?.getContainerElement()
    const input = container?.querySelector('ul .search input') as HTMLInputElement | null
    if (!container || !input) return

    // Confirm button: match the child <span icon="check"> and climb to <button>.
    // textContent equality fails because it concatenates the icon's "check" text.
    const confirmBtn = container
      .querySelector('.toolbar span[icon="check"]')
      ?.closest('button') as HTMLButtonElement | null

    const cleanup = () => {
      input.removeEventListener('keydown', onKeyDown, true)
      confirmBtn?.removeEventListener('click', onConfirmClick, true)
    }

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key !== 'Enter') return
      if (editingSearchChipRef.current !== chipId) return
      ev.preventDefault()
      ev.stopPropagation()
      cleanup()
      commitSearchChipEdit(chipId, input)
    }

    const onConfirmClick = (ev: MouseEvent) => {
      if (editingSearchChipRef.current !== chipId) return
      ev.preventDefault()
      ev.stopPropagation()
      cleanup()
      commitSearchChipEdit(chipId, input)
    }

    input.addEventListener('keydown', onKeyDown, true) // capture phase: run before React's bubble handler
    confirmBtn?.addEventListener('click', onConfirmClick, true)
  }

  // Intercept clicks on filter chips (search prefill + datetime edit dialog)
  const handleSearchBarClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement

    // Don't intercept clicks on the remove (X) button or include/exclude toggle
    if (target.closest('.remove') || target.closest('.button')) return

    const chipEl = target.closest('.search-filter-item')
    if (!chipEl) return

    // Edit a search chip: let the default edit-mode dropdown open, prefill its
    // input with the chip's current value, and mark this chip as being edited
    // so the input's Enter handler updates it instead of creating a new filter.
    const chipId = chipEl.id
    if (chipId === SEARCH_FILTER_ID || chipId.startsWith(SEARCH_FILTER_ID + '__')) {
      const filter = localFilters.find((f) => f.id === chipId)
      if (filter?.values?.length) {
        const text = (filter.values[0].label || String(filter.values[0].id)).replace(/%/g, '')
        editingSearchChipRef.current = chipId
        // Wait for the dropdown to render (after default click handlers fire)
        requestAnimationFrame(() => {
          prefillDropdownSearch(text)
          attachSearchEditCommitHandlers(chipId)
        })
      }
      return
    }

    // Find the label text from the chip (format: "Created At:")
    const labelEl = chipEl.querySelector('.label')
    if (!labelEl) return
    const chipLabel = labelEl.textContent?.replace(/:$/, '').trim()
    if (!chipLabel) return

    // Match against datetime filters in localFilters
    const datetimeFilter = localFilters.find(
      (f) => f.type === 'datetime' && f.label === chipLabel && f.values && f.values.length > 0,
    )

    if (!datetimeFilter) return

    // Check if it's a relative date (Today, This week, etc.) — let dropdown open normally
    const rangeValue = datetimeFilter.values?.[0]
    if (rangeValue?.id) {
      const customIdContent = (rangeValue.id as string).replace('custom-', '')
      const firstZIndex = customIdContent.indexOf('Z')
      if (firstZIndex > 0) {
        const startISO = customIdContent.substring(0, firstZIndex + 1)
        const endISO = customIdContent.substring(firstZIndex + 2)
        if (detectRelativeDatePattern(startISO, endISO)) {
          // Relative date — let SearchFilter handle it (open dropdown)
          return
        }
      }
    }

    // Custom date range — intercept and open the edit dialog
    e.stopPropagation()
    handleOpenCustomRangeForFilter(datetimeFilter.id)
  }

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
        onPasteCapture={handleDropdownPaste}
        enableAutosuggestion={true}
        pt={{
          searchBar: {
            style: {
              paddingRight: 28,
            },
            onClickCapture: handleSearchBarClickCapture,
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
                  if (!dateRange.handleDropdownItemClick(event, localFilters, options)) {
                    return false // prevent SearchFilter from selecting this value
                  }

                  // Auto-fill: if user typed text and then clicked a filter type,
                  // create the filter with that text as value and prevent normal flow
                  // (which would reopen the dropdown to the values panel)
                  const searchInput = listItem.parentElement?.querySelector(
                    '.search input',
                  ) as HTMLInputElement
                  const searchText = searchInput?.value?.trim() || ''

                  if (searchText) {
                    const optionId = listItem.id
                    // Only for top-level filter types (no data-parent = not a value item)
                    const parentAttr = listItem.getAttribute('data-parent')
                    if (!parentAttr) {
                      const matchingOption = options.find((o) => o.id === optionId)
                      if (matchingOption?.allowsCustomValues) {
                        const newId = buildFilterId(optionId)
                        const parts = searchText
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean)
                        const values =
                          parts.length > 1
                            ? parts.map((v) => ({ id: v, label: v, isCustom: true }))
                            : [{ id: searchText, label: searchText, isCustom: true }]
                        const newFilter: Filter = {
                          id: newId,
                          label: matchingOption.label,
                          type: matchingOption.type,
                          icon: matchingOption.icon,
                          values,
                        }

                        handleFinish([...localFilters, newFilter])
                        searchFilterRef.current?.close()
                        return false // prevent SearchFilter from reopening values panel
                      }
                    }
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
        onApply={handleCustomRangeApply}
        onClose={handleCustomRangeClose}
      />
    </>
  )
}

export default SearchFilterWrapper
