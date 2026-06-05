import { RowData } from '@tanstack/react-table'
import type { ListTableGroupDisplay, ListTableGroupingPathItem } from '../ListTable.types'

// ---- Types ----

/**
 * A group row that can be mixed into the data array passed to ListTable.
 * TData must extend this type (optional fields) so the row shape is compatible.
 */
export type ListTableGroupRow<TData> = {
  id: string
  __listTableGroup: true
  __groupColumnId: string
  __groupValue: ListTableGroupingPathItem
  __groupKey: string
  subRows: (ListTableGroupRow<TData> | TData)[]
}

// ---- Guards ----

export const isListTableGroupDisplayObject = (value: unknown): value is ListTableGroupDisplay =>
  !!value &&
  typeof value === 'object' &&
  ('label' in (value as object) || 'value' in (value as object))

export const isListTableGroupRow = <TData>(
  row: TData | ListTableGroupRow<TData>,
): row is ListTableGroupRow<TData> =>
  !!row && typeof row === 'object' && '__listTableGroup' in (row as object)

// ---- Comparators ----

export const getGroupItemValue = (value: ListTableGroupingPathItem | undefined) =>
  isListTableGroupDisplayObject(value) ? value.value : value

const getComparableGroupValue = (value: ListTableGroupingPathItem | undefined) => {
  if (isListTableGroupDisplayObject(value)) {
    if (typeof value.sortIndex === 'number') return value.sortIndex
    if (value.sortValue !== undefined) return value.sortValue
    if (value.label !== undefined) return value.label
    return value.value
  }
  return value
}

export const compareGroupingPathItems = (
  left: ListTableGroupingPathItem | undefined,
  right: ListTableGroupingPathItem | undefined,
) => {
  const comparableLeft = getComparableGroupValue(left)
  const comparableRight = getComparableGroupValue(right)

  if (typeof comparableLeft === 'number' && typeof comparableRight === 'number') {
    return comparableLeft - comparableRight
  }

  return String(comparableLeft ?? '').localeCompare(String(comparableRight ?? ''), undefined, {
    sensitivity: 'base',
  })
}

// ---- Sorting ----

const sortGroupedRows = <TData extends RowData>(
  rows: (ListTableGroupRow<TData> | TData)[],
  groupSortByDesc: boolean,
): (ListTableGroupRow<TData> | TData)[] => {
  const groupRows = rows.filter(isListTableGroupRow<TData>)
  const leafRows = rows.filter((r) => !isListTableGroupRow(r))

  groupRows.sort((left, right) => {
    const result = compareGroupingPathItems(left.__groupValue, right.__groupValue)
    return groupSortByDesc ? -result : result
  })

  groupRows.forEach((row) => {
    row.subRows = sortGroupedRows(row.subRows, groupSortByDesc)
  })

  return [...groupRows, ...leafRows]
}

// ---- Builder ----

export type GetGroupingPath<TData> = (
  columnId: string,
  row: TData,
) => ListTableGroupingPathItem[] | undefined

export type CreateGroupRow<TData> = (
  columnId: string,
  groupKey: string,
  groupValue: ListTableGroupingPathItem,
) => ListTableGroupRow<TData>

export type GetRowColumnValue<TData> = (row: TData, columnId: string) => unknown

/**
 * Builds a nested tree of group rows from a flat array.
 *
 * @param data        - Flat leaf rows
 * @param grouping    - Ordered list of column IDs to group by
 * @param groupSortByDesc - Sort group rows descending
 * @param getGroupingPath - Per-row path segments for a given column (allows multi-level folder paths)
 * @param createGroupRow  - Factory that constructs a typed group row
 * @param getRowColumnValue - Fallback to read a plain column value when getGroupingPath returns undefined
 */
export const buildGroupedData = <TData extends RowData>(
  data: TData[],
  grouping: string[],
  groupSortByDesc: boolean,
  getGroupingPath: GetGroupingPath<TData>,
  createGroupRow: CreateGroupRow<TData>,
  getRowColumnValue: GetRowColumnValue<TData>,
): (ListTableGroupRow<TData> | TData)[] => {
  const groupedRows: (ListTableGroupRow<TData> | TData)[] = []

  const insertRow = (
    container: (ListTableGroupRow<TData> | TData)[],
    row: TData,
    groupingIds: string[],
    parentKey: string,
  ) => {
    if (!groupingIds.length) {
      container.push(row)
      return
    }

    const [columnId, ...restGrouping] = groupingIds
    const segments = getGroupingPath(columnId, row) ?? [getRowColumnValue(row, columnId)]

    if (!segments.length) {
      insertRow(container, row, restGrouping, parentKey)
      return
    }

    const insertSegments = (
      segmentContainer: (ListTableGroupRow<TData> | TData)[],
      level: number,
      currentParentKey: string,
    ) => {
      const segment = segments[level]
      const segmentValue = getGroupItemValue(segment)
      const groupKey = `${currentParentKey}|${columnId}:${level}:${JSON.stringify(segmentValue)}`

      let groupRow = segmentContainer.find(
        (item): item is ListTableGroupRow<TData> =>
          isListTableGroupRow(item) && item.__groupKey === groupKey,
      )

      if (!groupRow) {
        groupRow = createGroupRow(columnId, groupKey, segment)
        segmentContainer.push(groupRow)
      }

      if (level < segments.length - 1) {
        insertSegments(groupRow.subRows, level + 1, groupKey)
        return
      }

      insertRow(groupRow.subRows, row, restGrouping, groupKey)
    }

    insertSegments(container, 0, parentKey)
  }

  data.forEach((row) => insertRow(groupedRows, row, grouping, 'root'))
  return sortGroupedRows(groupedRows, groupSortByDesc)
}
