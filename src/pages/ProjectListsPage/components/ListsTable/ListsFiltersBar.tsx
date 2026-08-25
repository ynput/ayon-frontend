import { forwardRef, useEffect, useState } from 'react'
import { Filter, SearchFilter, SearchFilterRef } from '@ynput/ayon-react-components'
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

const ListsFiltersBar = forwardRef<SearchFilterRef>((_props, ref) => {
  const { listsFilters, setListsFilters } = useListsDataContext()
  const options = useListsFilterOptions()

  // keeps track of the filters whilst adding/removing filters, committed on onFinish
  const [filters, setFilters] = useState<Filter[]>(listsFilters)

  useEffect(() => {
    setFilters(listsFilters)
  }, [listsFilters, setFilters])

  return (
    <Container>
      <SearchFilter
        ref={ref}
        compact
        options={options}
        filters={filters}
        onChange={setFilters}
        onFinish={setListsFilters}
        enableAutosuggestion={false}
      />
    </Container>
  )
})

export default ListsFiltersBar
