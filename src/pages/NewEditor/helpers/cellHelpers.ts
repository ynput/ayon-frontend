import { Row } from '@tanstack/react-table'
import { FolderNodeMap, MatchingFolder, TableRow, TaskNodeMap } from '../types'
import { TaskAttribType, TaskNode } from '@api/graphql'

const useCellHelper = (rawData: { folders: FolderNodeMap; tasks: TaskNodeMap }) => {
  const getRowType = (item: Row<TableRow>) => {
    return item.original.data.type === 'folder' ? 'folders' : 'tasks'
  }

  const getRawData = (item: Row<TableRow>) => {
    return rawData[getRowType(item)]?.[item.id]
  }

  const getCopyCellData = (item: Row<TableRow>, accessor: string) => {
    const type = getRowType(item)
    const data = getRawData(item)
    if (accessor === 'type') {
      return {
        type: type === 'folders' ? 'folderType' : 'taskType',
        value:
          type === 'folders' ? (data as MatchingFolder).folderType : (data as TaskNode).taskType,
        isAttrib: false,
      }
    }
    if (accessor === 'priority') {
      return {
        type: 'priority',
        value: data.attrib!.priority,
        isAttrib: true,
      }
    }
    if (accessor === 'status') {
      return {
        type: 'status',
        value: data.status,
        isAttrib: false,
      }
    }
    if (accessor === 'assignees') {
      return {
        type: 'assignees',
        value: (data as TaskNode).assignees,
        isAttrib: false,
      }
    }

    return {
      type: accessor,
      value: data.attrib![accessor as keyof TaskAttribType],
      isAttrib: true,
    }
  }

  const getUpdatesList = (
    matchingSets: { yStartIdx: number; yEndIdx: number }[],
    rows: Row<TableRow>[],
  ) => {
    let updates = []
    for (const set of matchingSets) {
      for (let i = set.yStartIdx; i <= set.yEndIdx; i++) {
        const row = rows[i]
        const rowType = getRowType(row)
        updates.push({
          id: row.id,
          type: rowType === 'folders' ? 'folder' : 'task',
        })
      }
    }

    return updates
  }

  return { getCopyCellData, getRowType, getRawData, getUpdatesList }
}

export default useCellHelper
