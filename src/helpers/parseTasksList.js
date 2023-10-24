import groupResult from './groupResult'

const sortByName = (a, b) => {
  if (a.node.name < b.node.name) return -1
  if (a.node.name > b.node.name) return 1
}

export const parseTasksList = (tasks, userName) => {
  const parsed = tasks
    .sort(sortByName)
    .map(({ node: { id, name, label, folder, taskType, assignees } }) => ({
      id: id,
      name: name,
      label: label,
      folderName: folder.label || folder.name,
      folderPath: folder.path,
      taskType: taskType,
      isMine: assignees.includes(userName) ? 'yes' : '',
    }))

  const grouped = groupResult(parsed, 'name')

  return grouped
}

export default parseTasksList
