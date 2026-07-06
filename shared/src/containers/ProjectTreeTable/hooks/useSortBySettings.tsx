import { useColumnSettingsContext, useProjectTableContext } from '../context'
import { SortCardType, SettingsSortingDropdown } from '@ynput/ayon-react-components'

const BUILT_IN_SORT_OPTIONS: { id: string; label: string; scopes?: string[] }[] = [
  { id: 'name', label: 'Name' },
  { id: 'status', label: 'Status' },
  { id: 'subType', label: 'Type' },
  { id: 'tags', label: 'Tags' },
  { id: 'assignees', label: 'Assignees', scopes: ['task'] },
  { id: 'folder', label: 'Folder' },
  { id: 'createdAt', label: 'Created at' },
  { id: 'updatedAt', label: 'Updated at' },
]

type SortColumn = { value: string; label: string }

export const useSortBySettings = (columns: SortColumn[] = []) => {
  const { sorting, updateSorting } = useColumnSettingsContext()
  const { attribFields, scopes } = useProjectTableContext()

  const options = [
    ...BUILT_IN_SORT_OPTIONS.filter(
      (opt) => !opt.scopes || opt.scopes.some((s) => scopes.includes(s)),
    ).map(({ id, label }) => ({ id, label })),
    ...attribFields
      .filter((field) => field.scope?.some((s) => scopes.includes(s)))
      .map((field) => ({
        id: `attrib_${field.name}`,
        label: field.data.title || field.name,
      })),
  ]

  const labelFor = (id: string) =>
    options.find((o) => o.id === id)?.label ?? columns.find((c) => c.value === id)?.label ?? id

  // Mirror the live sorting state so the panel stays in sync with the header
  // sort icons, even for columns that aren't predefined sort options.
  const value: SortCardType[] = sorting.map((s) => ({
    id: s.id,
    label: labelFor(s.id),
    sortOrder: !s.desc,
  }))

  // The dropdown can only render a selected value whose option exists, so add
  // any active-but-unlisted sort column to the option list.
  const dropdownOptions = [
    ...options,
    ...value
      .filter((v) => !options.some((o) => o.id === v.id))
      .map((v) => ({ id: v.id, label: v.label })),
  ]

  const handleChange = (v: SortCardType[]) => {
    updateSorting(v.map((item) => ({ id: item.id, desc: !item.sortOrder })))
  }

  return {
    id: 'sort-by',
    component: (
      <SettingsSortingDropdown
        title="Sort by"
        icon="sort"
        value={value}
        options={dropdownOptions}
        onChange={handleChange}
        multiSelect={false}
      />
    ),
  }
}
