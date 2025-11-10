import { AttributeField, SortingSetting } from '@shared/components'
import { SortCardType } from '@ynput/ayon-react-components'
import { FC } from 'react'

interface VPTableSortingSettingProps {
  sortBy?: string
  sortDesc: boolean
  attributes?: AttributeField[]
  onUpdateSorting: (sortBy: string | undefined, sortDesc: boolean) => void
}
const VP_BUILT_IN_SORT_OPTIONS = [
  { id: 'name', label: 'Name' },
  { id: 'status', label: 'Status' },
  { id: 'product', label: 'Product type' },
  { id: 'folder', label: 'Folder' },
  { id: 'subType', label: 'Product type' },
  { id: 'tags', label: 'Tags' },
  { id: 'author', label: 'Author' },
  { id: 'createdAt', label: 'Created at' },
  { id: 'updatedAt', label: 'Updated at' },
]

const VPTableSortingSetting: FC<VPTableSortingSettingProps> = ({
  sortBy,
  sortDesc,
  attributes = [],
  onUpdateSorting,
}) => {
  const attributeOptions = attributes.map((attrib) => ({
    id: 'attrib_' + attrib.name,
    label: attrib.data.title || attrib.name,
  }))
  const options = [...VP_BUILT_IN_SORT_OPTIONS, ...attributeOptions]
  const sortByOption = options.find((option) => option.id === sortBy)
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
      options={options}
      onChange={handleChange}
      multiSelect={false}
      maxOptionsShown={100}
    />
  )
}

export default VPTableSortingSetting
