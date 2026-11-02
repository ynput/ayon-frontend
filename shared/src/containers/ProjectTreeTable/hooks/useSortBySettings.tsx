import { useColumnSettingsContext, useProjectTableContext } from '../context'
import {
  getColumnIcon,
  getSortableColumnOptions,
  isMultiSelectAttribute,
} from '../buildTreeTableColumns'
import { SortSettings } from '@shared/components/SettingsPanel/SortSettings'
import type { SettingsPanelItem } from '@shared/components/SettingsPanel/SettingsPanelItemTemplate'

type SortColumn = { value: string; label: string }

export const useSortBySettings = (columns: SortColumn[] = []) => {
  const { sorting, updateSorting } = useColumnSettingsContext()
  const { attribFields, scopes } = useProjectTableContext()

  const options: SettingsPanelItem[] = [
    ...getSortableColumnOptions(scopes, columns).map((option) => ({
      value: option.id,
      label: option.label,
    })),
    ...attribFields
      .filter(
        (field) => field.scope?.some((s) => scopes.includes(s)) && !isMultiSelectAttribute(field),
      )
      .map((field) => ({
        value: `attrib_${field.name}`,
        label: field.data.title || field.name,
      })),
  ].map((option) => ({ ...option, icon: getColumnIcon(option.value) }))

  // Mirror the live sorting state so the panel stays in sync with the header
  // sort icons, even for columns that aren't predefined sort options.
  const optionIds = new Set(options.map((option) => option.value))
  const allOptions = [
    ...options,
    ...sorting
      .filter((s) => !optionIds.has(s.id))
      .map((s) => ({
        value: s.id,
        label: columns.find((c) => c.value === s.id)?.label ?? s.id,
        icon: getColumnIcon(s.id),
      })),
  ]

  const labelFor = (id: string) => allOptions.find((o) => o.value === id)?.label ?? id

  const preview = sorting.length
    ? labelFor(sorting[0].id) + (sorting.length > 1 ? ` +${sorting.length - 1}` : '')
    : 'None'

  return {
    id: 'sort-by',
    title: 'Sort',
    icon: 'sort',
    preview,
    component: <SortSettings sorting={sorting} options={allOptions} onChange={updateSorting} />,
  }
}
