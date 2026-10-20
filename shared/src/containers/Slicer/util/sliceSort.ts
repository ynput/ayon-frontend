import type { SortMenuOption } from '@shared/components/Menu/sortMenuItem'
import type { SimpleTableRow } from '@shared/containers/SimpleTable/SimpleTable.types'
import { DEFAULT_LISTS_SORT, LISTS_SORT_OPTIONS, sortLists } from '@shared/util/sortLists'
import type { SliceSort, SliceType } from '../types'

// 'default' is the order the slice data arrives in: anatomy order, enum order and so on
export const SLICE_DEFAULT_ORDER = 'default'

const NAME_OPTION: SortMenuOption = { id: 'label', label: 'Name', desc: false }
const orderOption = (label: string): SortMenuOption => ({
  id: SLICE_DEFAULT_ORDER,
  label,
  desc: false,
})

const NAME_ONLY = ['hierarchy', 'assignees', 'author']
const ANATOMY = ['status', 'type', 'taskType', 'folderType']

// the first option is the default, except for lists which keep their newest first default
export const getSliceSortOptions = (sliceType: SliceType): SortMenuOption[] => {
  if (NAME_ONLY.includes(sliceType)) return [NAME_OPTION]
  if (sliceType === 'entityList') return LISTS_SORT_OPTIONS
  if (sliceType.startsWith('attrib.')) return [orderOption('Attribute order'), NAME_OPTION]
  if (ANATOMY.includes(sliceType)) return [orderOption('Anatomy order'), NAME_OPTION]
  return [orderOption('Default order'), NAME_OPTION]
}

export const getDefaultSliceSort = (sliceType: SliceType): SliceSort => {
  if (sliceType === 'entityList') return DEFAULT_LISTS_SORT
  const [first] = getSliceSortOptions(sliceType)
  return { by: first.id, desc: first.desc }
}

// view settings can hold anything, fall back to the default instead of breaking the panel
export const resolveSliceSort = (sliceType: SliceType, sort: unknown): SliceSort => {
  const { by, desc } = (sort || {}) as Partial<SliceSort>
  if (!getSliceSortOptions(sliceType).some((option) => option.id === by)) {
    return getDefaultSliceSort(sliceType)
  }
  return { by: by as string, desc: !!desc }
}

// "No value" and "Some value" stay on top whatever the sorting is
const PINNED_ROW_IDS = ['noValue', 'hasValue']
// list folders keep their own order, like on the lists page; only the lists in them are sorted
const isListFolderRow = (row: SimpleTableRow) => row.id.startsWith('folder-')

const nameCollator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true })
const getRowName = (row: SimpleTableRow) => row.label || row.name || ''

const sortSiblings = (
  rows: SimpleTableRow[],
  sliceType: SliceType,
  { by, desc }: SliceSort,
): SimpleTableRow[] => {
  const isFixed = (row: SimpleTableRow) =>
    PINNED_ROW_IDS.includes(row.id) || (sliceType === 'entityList' && isListFolderRow(row))
  const fixed = rows.filter(isFixed)
  const sortable = rows.filter((row) => !isFixed(row))

  let sorted: SimpleTableRow[]
  if (sliceType === 'entityList') {
    // same ordering as the lists page: archived last, ties newest first
    sorted = sortLists(
      sortable.map((row) => ({
        row,
        label: getRowName(row),
        active: row.data?.active ?? true,
        createdAt: row.data?.createdAt,
        updatedAt: row.data?.updatedAt,
      })),
      { by: by as typeof DEFAULT_LISTS_SORT.by, desc },
    ).map(({ row }) => row)
  } else if (by === SLICE_DEFAULT_ORDER) {
    sorted = desc ? [...sortable].reverse() : sortable
  } else {
    const direction = desc ? -1 : 1
    sorted = [...sortable].sort(
      (a, b) => nameCollator.compare(getRowName(a), getRowName(b)) * direction,
    )
  }

  return [...fixed, ...sorted].map((row) =>
    row.subRows?.length
      ? { ...row, subRows: sortSiblings(row.subRows, sliceType, { by, desc }) }
      : row,
  )
}

export const sortSliceRows = (
  rows: SimpleTableRow[],
  sliceType: SliceType,
  sort: SliceSort,
): SimpleTableRow[] => {
  const fallback = getDefaultSliceSort(sliceType)
  // Name sorts must use the same comparator in both directions.
  if (sort.by !== 'label' && sort.by === fallback.by && sort.desc === fallback.desc) return rows
  return sortSiblings(rows, sliceType, sort)
}
