import { SortingSetting } from '@shared/components'
import { SortCardType } from '@ynput/ayon-react-components'
import { FC } from 'react'

interface ProductsAndVersionsSortingProps {
  sortBy?: string
  sortDesc: boolean
  onUpdateSorting: (sortBy: string | undefined, sortDesc: boolean) => void
}
const VP_SORT_OPTIONS = [
  { id: 'name', label: 'Name' },
  { id: 'status', label: 'Status' },
  { id: 'tags', label: 'Tags' },
  { id: 'subType', label: 'Product type' },
  { id: 'author', label: 'Author' },
  { id: 'createdAt', label: 'Created at' },
  { id: 'updatedAt', label: 'Updated at' },
]

const ProductsAndVersionsSorting: FC<ProductsAndVersionsSortingProps> = ({
  sortBy,
  sortDesc,
  onUpdateSorting,
}) => {
  const sortByOption = VP_SORT_OPTIONS.find((option) => option.id === sortBy)
  const value = sortByOption ? [{ ...sortByOption, sortOrder: !sortDesc }] : []

  const handleChange = (v: SortCardType[]) => {
    if (v.length === 0) {
      // Clear sorting
      onUpdateSorting(undefined, false)
    }
    const selectedOption = v[0]
    if (selectedOption) {
      const newSortBy = selectedOption.id
      const newSortDesc = !selectedOption.sortOrder
      // Update sorting
      onUpdateSorting(newSortBy, newSortDesc)
    }
  }

  return (
    <SortingSetting
      title="Sort by"
      value={value}
      options={VP_SORT_OPTIONS}
      onChange={handleChange}
      multiSelect={false}
    />
  )
}

export default ProductsAndVersionsSorting
