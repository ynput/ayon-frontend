import type {
  EditorTaskNode,
  FolderNodeMap,
  MatchingFolder,
  TaskNodeMap,
  TasksByFolderMap,
} from '@shared/containers/ProjectTreeTable'

export const ROOT_LEVEL = '__root__'

export const FOLDER_ROW_HEIGHT = 44
// caret + gap, so the card body lines up with the folder icon
export const FOLDER_BODY_OFFSET = 30
const MAX_INDENT_DEPTH = 4

export const getIndent = (depth: number) => 8 + Math.min(depth, MAX_INDENT_DEPTH) * 8

export const getFolderLabel = (folder: MatchingFolder) => folder.label || folder.name

const compareFolders = (a: MatchingFolder, b: MatchingFolder) =>
  getFolderLabel(a).localeCompare(getFolderLabel(b), undefined, { numeric: true })

// same root rule as the table: no parent, or a parent filtered out of the map
export const getChildrenByParent = (foldersMap: FolderNodeMap) => {
  const childrenByParent = new Map<string, MatchingFolder[]>()
  for (const folder of foldersMap.values()) {
    const parentKey =
      folder.parentId && foldersMap.has(folder.parentId) ? folder.parentId : ROOT_LEVEL
    const siblings = childrenByParent.get(parentKey)
    if (siblings) siblings.push(folder)
    else childrenByParent.set(parentKey, [folder])
  }
  for (const siblings of childrenByParent.values()) siblings.sort(compareFolders)
  return childrenByParent
}

// open folders whose ancestors are all open: what the task loader may fetch
export const getOpenTaskFolderIds = (
  childrenByParent: Map<string, MatchingFolder[]>,
  expandedMap: Record<string, boolean>,
) => {
  const ids: string[] = []
  const walk = (parentKey: string) => {
    for (const folder of childrenByParent.get(parentKey) ?? []) {
      if (!expandedMap[folder.id]) continue
      if (folder.hasTasks !== false) ids.push(folder.id)
      walk(folder.id)
    }
  }
  walk(ROOT_LEVEL)
  return ids
}

export const getFolderTasks = (
  folderId: string,
  tasksByFolderMap: TasksByFolderMap,
  tasksMap: TaskNodeMap,
): EditorTaskNode[] =>
  (tasksByFolderMap.get(folderId) ?? []).flatMap((taskId) => tasksMap.get(taskId) ?? [])

export const getTaskCountLabel = (count: number) => `${count} ${count === 1 ? 'task' : 'tasks'}`
