// The host's PanelTabHeader (@ynput/ayon-addon): an addon tab's menu, search bar and extra
// content, rendered into the header the details panel puts above the tab (its title is the tab's
// label). Portals keep them in the addon's React tree, so its own contexts still apply. Outside a
// details panel tab (the dev shell's preview of the component alone) it renders a header in place.
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  SEARCH_FILTER_ID,
  SearchFilter,
  buildFilterId,
  getFilterFromId,
} from '@ynput/ayon-react-components'
import type { Filter, Option } from '@ynput/ayon-react-components'
import type { TabHeaderFilter, TabHeaderSearch } from '@ynput/ayon-addon'
import type { HostPanelTabHeaderProps } from '@ynput/ayon-addon/host'
import {
  PanelTabHeader,
  PanelTabSearch,
  usePanelTabHeaderSlots,
} from '@shared/components/PanelTabs'
import { AddonMoreMenu } from './AddonMoreMenu'

const toOptions = (options: TabHeaderSearch['options'] = []): Option[] =>
  options.map((option) => ({
    id: option.id,
    label: option.label,
    icon: option.icon,
    type: 'list_of_strings',
    singleSelect: option.singleSelect,
    values: option.values,
  }))

const toClientFilters = (filters: TabHeaderFilter[] = [], options: Option[]): Filter[] =>
  filters.flatMap((filter) => {
    const option = options.find((o) => o.id === filter.id)
    if (!option) return []
    return [
      {
        id: buildFilterId(filter.id),
        label: option.label,
        icon: option.icon,
        type: option.type,
        singleSelect: option.singleSelect,
        inverted: filter.inverted,
        values: filter.values.map(
          (id) => option.values?.find((value) => value.id === id) || { id, label: id },
        ),
      },
    ]
  })

const toTabHeaderFilters = (filters: Filter[], options: Option[]): TabHeaderFilter[] =>
  filters.flatMap((filter) => {
    const id = getFilterFromId(filter.id)
    if (!options.some((o) => o.id === id)) return []
    return [
      {
        id,
        values: (filter.values || []).map((value) => value.id),
        ...(filter.inverted ? { inverted: true } : {}),
      },
    ]
  })

const isSearchChip = (filter: Filter) => getFilterFromId(filter.id) === SEARCH_FILTER_ID

// the header's search button: shown while a search bar exists, marked while it is set
const useHeaderSearchState = (active: boolean) => {
  const slots = usePanelTabHeaderSlots()
  useEffect(() => {
    slots?.setSearchState({ has: true, active })
  }, [slots, active])
  useEffect(() => () => slots?.setSearchState({ has: false, active: false }), [slots])
}

// `variant: 'text'`: the plain text search of AYON's own Details tabs, applied as it is typed
const TabHeaderTextSearch = ({ search }: { search: TabHeaderSearch }) => {
  const [text, setText] = useState('')
  useHeaderSearchState(!!text)

  return (
    // where the search and filter bar is
    <div style={{ paddingTop: 4 }}>
      <PanelTabSearch
        value={text}
        placeholder={search.placeholder}
        onChange={(value) => {
          setText(value)
          search.onSearch(value)
        }}
      />
    </div>
  )
}

const TabHeaderSearchBar = ({ search }: { search: TabHeaderSearch }) => {
  // keyed by content: addons pass these inline, and rebuilt chips get new ids, which would close
  // a filter the user is editing
  const optionsKey = JSON.stringify(search.options ?? [])
  const filtersKey = JSON.stringify(search.filters ?? null)
  const options = useMemo(() => toOptions(JSON.parse(optionsKey)), [optionsKey])
  const controlled = useMemo(
    () => toClientFilters(JSON.parse(filtersKey) ?? undefined, options),
    [filtersKey, options],
  )
  // the bar's filters, also the search text chips the addon doesn't keep
  const [filters, setFilters] = useState<Filter[]>(controlled)
  // controlled filters replace the bar's own; without them the bar keeps what the user set
  useEffect(() => {
    if (filtersKey === 'null') return
    setFilters((current) => [...current.filter(isSearchChip), ...controlled])
  }, [controlled, filtersKey])

  useHeaderSearchState(filters.some((f) => !!f.values?.length))

  const handleFinish = (next: Filter[]) => {
    setFilters(next)
    const text = next
      .filter(isSearchChip)
      .flatMap((f) => (f.values || []).map((value) => value.label))
      .join(' ')
    search.onSearch(text)
    search.onFiltersChange?.(toTabHeaderFilters(next, options))
  }

  return (
    <div style={{ padding: '4px 8px 0' }}>
      <SearchFilter
        compact
        options={options}
        filters={filters}
        onChange={setFilters}
        onFinish={handleFinish}
        enableGlobalSearch
        enableMultipleSameFilters={false}
        enableAutosuggestion={false}
      />
    </div>
  )
}

export const AddonPanelTabHeader = ({
  menu,
  search,
  children,
  onError,
}: HostPanelTabHeaderProps) => {
  const slots = usePanelTabHeaderSlots()
  const menuNode = menu?.length ? <AddonMoreMenu items={menu} onError={onError} /> : null
  const searchNode = !search ? null : search.variant === 'text' ? (
    <TabHeaderTextSearch search={search} />
  ) : (
    <TabHeaderSearchBar search={search} />
  )
  const extraNode = children ? <div style={{ padding: '4px 8px' }}>{children}</div> : null

  if (!slots) {
    return (
      <PanelTabHeader menu={menuNode} search={searchNode}>
        {extraNode}
      </PanelTabHeader>
    )
  }

  return (
    <>
      {slots.menu && menuNode && createPortal(menuNode, slots.menu)}
      {slots.search && searchNode && createPortal(searchNode, slots.search)}
      {slots.extra && extraNode && createPortal(extraNode, slots.extra)}
    </>
  )
}

/** @deprecated the dev shell of `@ynput/ayon-addon-dev` 0.5 imports it: use `AddonPanelTabHeader` */
export const AddonDetailsPanelTabHeader = AddonPanelTabHeader
