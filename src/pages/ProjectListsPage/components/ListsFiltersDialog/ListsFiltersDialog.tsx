import { useListsDataContext } from '@pages/ProjectListsPage/context/ListsDataContext'
import { Filter, SearchFilter, SearchFilterRef } from '@ynput/ayon-react-components'
import { FC, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { useListsContext } from '@pages/ProjectListsPage/context'
import useListsFilterOptions from '@pages/ProjectListsPage/hooks/useListsFilterOptions'

const Dialog = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;

  & > * {
    max-width: 600px;
    position: absolute;
    top: 25%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
`

interface ListsFiltersDialogProps {}

const ListsFiltersDialog: FC<ListsFiltersDialogProps> = ({}) => {
  const { listsFilters, setListsFilters } = useListsDataContext()
  const { listsFiltersOpen, setListsFiltersOpen } = useListsContext()

  const filtersRef = useRef<SearchFilterRef>(null)

  useEffect(() => {
    if (listsFiltersOpen && filtersRef.current) {
      filtersRef.current.open()
    }
  }, [listsFiltersOpen, filtersRef])

  const options = useListsFilterOptions()

  // keeps track of the filters whilst adding/removing filters
  const [filters, setFilters] = useState<Filter[]>(listsFilters)

  // update filters when it changes
  useEffect(() => {
    setFilters(listsFilters)
  }, [listsFilters, setFilters])

  //   on keydown, close the dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // only close if already open and not focused on an input
      if (e.key === 'Escape' && listsFiltersOpen && document.activeElement?.tagName !== 'INPUT') {
        setListsFiltersOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [setListsFiltersOpen, listsFiltersOpen])

  if (!listsFiltersOpen) return null

  return createPortal(
    <Dialog
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setListsFiltersOpen(false)
        }
      }}
    >
      <SearchFilter
        options={options}
        filters={filters}
        onChange={setFilters}
        onFinish={(v) => {
          setListsFilters(v) // update the filters in the context
          setListsFiltersOpen(false) // close the dialog
        }}
        enableAutosuggestion={false}
        ref={filtersRef}
      />
    </Dialog>,
    document.body,
  )
}

export default ListsFiltersDialog
