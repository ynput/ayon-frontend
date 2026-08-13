import { AttributeField } from '@shared/components'
import { SortCardType, SettingsSortingDropdown } from '@ynput/ayon-react-components'
import { getSortableColumnOptions } from '@shared/containers'
import { FC } from 'react'

interface VPTableSortingSettingProps {
  sortBy?: string
  sortDesc: boolean
  attributes?: AttributeField[]
  onUpdateSorting: (sortBy: string | undefined, sortDesc: boolean) => void
}
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
  const options = [...getSortableColumnOptions(['version', 'product']), ...attributeOptions]
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
    <SettingsSortingDropdown
      title="Sort by"
      icon="sort"
      value={value}
      options={options}
      onChange={handleChange}
      multiSelect={false}
      maxOptionsShown={100}
    />
  )
}

export default VPTableSortingSetting
