import groupResult from './groupResult'

export const parseTasksList = (tasks, userName) => {
  const parsed = tasks.map(({ node: { id, name, label, folder, taskType, assignees } }) => ({
    id: id,
    name: name,
    label: label,
    folderName: folder.label || folder.name,
    taskType: taskType,
    isMine: assignees.includes(userName) ? 'yes' : '',
  }))

  const grouped = groupResult(parsed, 'name')

  return grouped
}

export default parseTasksList
