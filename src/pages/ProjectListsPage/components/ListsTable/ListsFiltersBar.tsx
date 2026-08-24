import { forwardRef, useEffect, useMemo, useState } from 'react'
import {
  Filter,
  SearchFilter,
  SearchFilterRef,
  SEARCH_FILTER_ID,
} from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { useListsDataContext } from '@pages/ProjectListsPage/context/ListsDataContext'
import useListsFilterOptions from '@pages/ProjectListsPage/hooks/useListsFilterOptions'

const Container = styled.div`
  padding: 4px;
  /* header is a centering column flex: without this the bar hugs its content
     and jumps to the middle whenever a value dropdown empties the bar */
  width: 100%;
  min-width: 0;
`

interface ListsFiltersBarProps {
  onSearch: (search: string | null) => void
}

const ListsFiltersBar = forwardRef<SearchFilterRef, ListsFiltersBarProps>(({ onSearch }, ref) => {
  const { listsFilters, setListsFilters } = useListsDataContext()
  const options = useListsFilterOptions()

  // keeps track of the filters whilst adding/removing filters, committed on onFinish
  const [filters, setFilters] = useState<Filter[]>(listsFilters)

  useEffect(() => {
    setFilters(listsFilters)
  }, [listsFilters, setFilters])

  const [liveSearch, setLiveSearch] = useState('')

  const chipTerm = useMemo(() => {
    const chip = listsFilters.find((f) => f.id.startsWith(SEARCH_FILTER_ID))
    const raw = chip?.values?.[0]?.label ?? String(chip?.values?.[0]?.id ?? '')
    return raw.replace(/%/g, '').trim()
  }, [listsFilters])

  // live typing wins over the committed search chip
  useEffect(() => {
    onSearch(liveSearch || chipTerm || '')
  }, [liveSearch, chipTerm])

  useEffect(() => () => onSearch(null), [])

  return (
    <Container>
      <SearchFilter
        ref={ref}
        compact
        options={options}
        filters={filters}
        onChange={setFilters}
        onFinish={setListsFilters}
        onSearchChange={(value, filter) => setLiveSearch(filter ? '' : value)}
        enableGlobalSearch
        globalSearchConfig={{ enableMultiple: false }}
        enableAutosuggestion={false}
      />
    </Container>
  )
})

export default ListsFiltersBar
