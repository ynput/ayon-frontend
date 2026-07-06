import { FC, useState, useEffect } from 'react'
import { Filter, Option, SearchFilter } from '@ynput/ayon-react-components'
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import {
  clientFilterToQueryFilter,
  queryFilterToClientFilter,
} from '@shared/containers/ProjectTreeTable'

interface InboxSearchFilterProps {
  options: Option[]
  queryFilters: QueryFilter
  onChange: (queryFilter: QueryFilter) => void
}

const InboxSearchFilter: FC<InboxSearchFilterProps> = ({ options, queryFilters, onChange }) => {
  const filters = queryFilterToClientFilter(queryFilters, options)
  const [localFilters, setLocalFilters] = useState<Filter[]>(filters)

  useEffect(() => {
    setLocalFilters(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)])

  const handleFinish = (newFilters: Filter[]) => {
    onChange(clientFilterToQueryFilter(newFilters))
  }

  return (
    <SearchFilter
      options={options}
      filters={localFilters}
      onChange={setLocalFilters}
      onFinish={handleFinish}
      enableMultipleSameFilters={false}
      enableGlobalSearch={true}
    />
  )
}

export default InboxSearchFilter
