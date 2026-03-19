import { SubTaskNode } from '@shared/api'

/**
 * Convert subtasks to TSV format for clipboard
 * Format: TaskId\tTaskName\tLabel\tName\tStart Date\tEnd Date\tAssignees\tStatus (no header row)
 * Includes taskId and taskName so pasted subtasks can be grouped by their parent task
 */
export const subtasksToTSV = (
  subtasks: SubTaskNode[],
  taskId?: string,
  taskName?: string,
): string => {
  const rows = subtasks.map((s) => [
    taskId || '',
    taskName || '',
    s.label || '',
    s.name || '',
    s.startDate || '',
    s.endDate || '',
    (s.assignees || []).join(', '),
    s.isDone ? 'Done' : 'Todo',
  ])
  return rows.map((row) => row.join('\t')).join('\n')
}

/**
 * Convert a single subtask to TSV format (without headers)
 */
export const subtaskToTSV = (subtask: SubTaskNode, taskId?: string, taskName?: string): string => {
  const row = [
    taskId || '',
    taskName || '',
    subtask.label || '',
    subtask.name || '',
    subtask.startDate || '',
    subtask.endDate || '',
    (subtask.assignees || []).join(', '),
    subtask.isDone ? 'Done' : 'Todo',
  ]
  return row.join('\t')
}

/**
 * Parse TSV clipboard data back to subtask format
 * Returns array of partial SubTaskNode objects with taskId and taskName (for updating)
 */
export const tsvToSubtasks = (
  tsvData: string,
): Array<
  Partial<SubTaskNode> & { label: string; name: string; taskId?: string; taskName?: string }
> => {
  const lines = tsvData.trim().split('\n')
  if (lines.length === 0) return []

  // Check if first line is a header (contains expected column names)
  const firstLine = lines[0].toLowerCase()
  const hasHeader =
    firstLine.includes('taskid') &&
    firstLine.includes('taskname') &&
    firstLine.includes('label') &&
    firstLine.includes('name') &&
    firstLine.includes('start date') &&
    firstLine.includes('end date') &&
    firstLine.includes('assignees') &&
    firstLine.includes('status')

  const dataLines = hasHeader ? lines.slice(1) : lines

  const parsedSubtasks = dataLines
    .map((line) => {
      const values = line.split('\t')
      if (values.length < 6) return null // Need at least 6 columns (6-8 depending on whether taskId/taskName are present)

      // Try to parse with taskId and taskName (8 columns)
      let taskId: string | undefined
      let taskName: string | undefined
      let label: string
      let name: string
      let startDate: string | undefined
      let endDate: string | undefined
      let assigneesStr: string
      let statusStr: string

      if (values.length >= 8) {
        // New format with taskId and taskName
        ;[taskId, taskName, label, name, startDate, endDate, assigneesStr, statusStr] = values
        taskId = taskId || undefined
        taskName = taskName || undefined
      } else {
        // Old format without taskId and taskName
        ;[label, name, startDate, endDate, assigneesStr, statusStr] = values.slice(0, 6)
      }

      // Parse assignees (comma-separated list)
      const assignees = assigneesStr
        ? assigneesStr
            .split(',')
            .map((a) => a.trim())
            .filter(Boolean)
        : []

      // Parse status
      const isDone = statusStr?.toLowerCase().trim() === 'done'

      const subtask: Partial<SubTaskNode> & {
        label: string
        name: string
        taskId?: string
        taskName?: string
      } = {
        label: label || '',
        name: name || '',
        assignees,
        isDone,
      }

      // Add task context if present
      if (taskId) subtask.taskId = taskId
      if (taskName) subtask.taskName = taskName

      // Only add dates if they're not empty
      if (startDate) subtask.startDate = startDate
      if (endDate) subtask.endDate = endDate

      return subtask
    })
    .filter(
      (
        subtask,
      ): subtask is Partial<SubTaskNode> & {
        label: string
        name: string
        taskId?: string
        taskName?: string
      } => subtask !== null,
    )

  return parsedSubtasks
}

/**
 * Check if clipboard text looks like subtasks TSV data
 */
export const isSubtasksTSV = (text: string): boolean => {
  const lines = text.trim().split('\n')
  if (lines.length === 0) return false

  // Check if it has tab-separated values
  const firstLine = lines[0]
  if (!firstLine.includes('\t')) return false

  // Check if it has the expected columns (8 columns for new format with taskId/taskName, or 6+ for old format)
  const columns = firstLine.split('\t')
  if (columns.length < 6) return false

  // Check if header matches our format (case-insensitive)
  const lowerFirstLine = firstLine.toLowerCase()
  if (
    lowerFirstLine.includes('taskid') &&
    lowerFirstLine.includes('taskname') &&
    lowerFirstLine.includes('label') &&
    lowerFirstLine.includes('name') &&
    lowerFirstLine.includes('start date') &&
    lowerFirstLine.includes('end date') &&
    lowerFirstLine.includes('assignees') &&
    lowerFirstLine.includes('status')
  ) {
    return true
  }

  // Support old format without taskId/taskName
  if (
    lowerFirstLine.includes('label') &&
    lowerFirstLine.includes('name') &&
    lowerFirstLine.includes('start date') &&
    lowerFirstLine.includes('end date') &&
    lowerFirstLine.includes('assignees') &&
    lowerFirstLine.includes('status')
  ) {
    return true
  }

  // If no header, check if last column is likely a status (Done/Todo)
  if (lines.length > 0) {
    const lastCol = columns[columns.length - 1]?.toLowerCase().trim()
    return lastCol === 'done' || lastCol === 'todo'
  }

  return false
}

// Sanitize name to match regex: ^[a-zA-Z0-9_]([a-zA-Z0-9_\.\-]*[a-zA-Z0-9_])?$
export const sanitizeSubtaskName = (name: string): string => {
  // Replace invalid characters with underscore
  let sanitized = name.replace(/[^a-zA-Z0-9_\.\-]/g, '_')

  // Ensure it starts with a valid character
  if (sanitized.length > 0 && !/^[a-zA-Z0-9_]/.test(sanitized)) {
    sanitized = 's_' + sanitized
  }

  // Ensure it ends with a valid character
  if (sanitized.length > 0 && !/[a-zA-Z0-9_]$/.test(sanitized)) {
    sanitized = sanitized + '_'
  }

  // If empty, provide a default
  if (!sanitized) sanitized = 'subtask'

  return sanitized
}
