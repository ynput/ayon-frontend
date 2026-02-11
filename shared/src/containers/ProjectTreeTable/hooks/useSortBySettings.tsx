import { useColumnSettingsContext, useProjectTableContext } from '../context'
import { SortingSetting } from '@shared/components'
import { SortCardType } from '@ynput/ayon-react-components'

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

export const useSortBySettings = () => {
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

  const value: SortCardType[] = sorting
    .map((s) => {
      const option = options.find((o) => o.id === s.id)
      if (!option) return null
      return { ...option, sortOrder: !s.desc }
    })
    .filter(Boolean) as SortCardType[]

  const handleChange = (v: SortCardType[]) => {
    updateSorting(v.map((item) => ({ id: item.id, desc: !item.sortOrder })))
  }

  return {
    id: 'sort-by',
    component: (
      <SortingSetting
        title="Sort by"
        value={value}
        options={options}
        onChange={handleChange}
        multiSelect={false}
      />
    ),
  }
}