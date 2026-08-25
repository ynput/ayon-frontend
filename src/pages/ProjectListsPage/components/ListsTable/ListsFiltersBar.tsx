import { forwardRef, useEffect, useState } from 'react'
import { Filter, SearchFilter, SearchFilterRef } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { useListsDataContext } from '@pages/ProjectListsPage/context/ListsDataContext'
import useListsFilterOptions from '@pages/ProjectListsPage/hooks/useListsFilterOptions'
import { HeaderButton } from '@shared/containers/SimpleTable'

const Container = styled.div`
  position: relative;
  padding: 0 4px 4px;
  /* header is a centering column flex: without this the bar hugs its content
     and jumps to the middle whenever a value dropdown empties the bar */
  width: 100%;
  min-width: 0;

  /* the bar stacks under the plain search input: a magnifier would read as a second search box */
  /* .search-filter.compact needed to outweigh the icon sizing rule inside ARC */
  .search-filter.compact .search-bar > .icon.search {
    font-size: 0;
    &::after {
      content: 'filter_list';
      font-size: 20px;
    }
  }

  /* keeps chips and the input clear of the close button */
  .search-filter.compact .search-bar {
    padding-right: 28px;
  }
`

const CloseButton = styled(HeaderButton)`
  position: absolute;
  top: 50%;
  right: 6px;
  transform: translateY(-50%);
  /* the bar itself sits at 301 */
  z-index: 302;
`

interface ListsFiltersBarProps {
  onClose: () => void
}

const ListsFiltersBar = forwardRef<SearchFilterRef, ListsFiltersBarProps>(({ onClose }, ref) => {
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
      <CloseButton icon="close" variant="text" onClick={onClose} />
    </Container>
  )
})

export default ListsFiltersBar
