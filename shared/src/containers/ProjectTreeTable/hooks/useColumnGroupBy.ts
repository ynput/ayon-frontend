import { useCallback, useMemo } from 'react'
import { useColumnSettingsContext, useProjectTableContext } from '../context'
import { isAttribGroupable } from './useGetGroupedFields'

/**
 * Encapsulates mapping a table column to a groupBy id, determining if it is eligible
 * for grouping, and providing a helper to trigger grouping.
 */
export const useColumnGroupBy = (columnId: string) => {
  const { updateGroupBy } = useColumnSettingsContext()
  const { attribFields, scopes } = useProjectTableContext()

  const isAttribColumn = columnId.startsWith('attrib_')
  const attribName = isAttribColumn ? columnId.replace('attrib_', '') : undefined
  const attribField = useMemo(
    () => (isAttribColumn ? attribFields.find((f) => f.name === attribName) : undefined),
    [attribFields, isAttribColumn, attribName],
  )

  const targetGroupById = useMemo(() => {
    if (columnId.startsWith('attrib_')) return 'attrib.' + columnId.replace('attrib_', '')
    if (columnId === 'subType') {
      if (scopes.includes('task')) {
        return 'taskType'
      } else if (scopes.includes('version')) {
        return 'productType'
      }
    }
    if (['status', 'assignees', 'tags', 'taskType'].includes(columnId)) return columnId
    return undefined
  }, [columnId])

  const canGroupThisColumn = useMemo(() => {
    if (!targetGroupById) return false
    if (!isAttribColumn) return true
    return !!attribField && isAttribGroupable(attribField, 'task')
  }, [attribField, isAttribColumn, targetGroupById])

  const groupLabel = useMemo(() => {
    if (isAttribColumn)
      return attribField?.data.title || attribField?.name || attribName || 'Attribute'
    if (columnId === 'status') return 'Status'
    if (columnId === 'subType') return 'Type'
    if (columnId === 'assignees') return 'Assignees'
    if (columnId === 'tags') return 'Tags'
    return 'Column'
  }, [attribField, attribName, columnId, isAttribColumn])

  const groupBySelectedColumn = useCallback(() => {
    if (targetGroupById) updateGroupBy({ id: targetGroupById, desc: false })
  }, [targetGroupById, updateGroupBy])

  return {
    targetGroupById,
    canGroupThisColumn,
    groupLabel,
    groupBySelectedColumn,
  }
}
