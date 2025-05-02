import groupResult from '../../shared/src/util/groupResult'

const sortByName = (a, b) => {
  const labelA = a.node.label || a.node.name
  const labelB = b.node.label || b.node.name
  return labelA.localeCompare(labelB)
}

export const parseTasksList = (tasks, userName) => {
  const parsed = tasks
    ?.sort(sortByName)
    .map(({ node: { id, name, active, label, folder, taskType, assignees } }) => ({
      id: id,
      name: name,
      label: label,
      folderName: folder.label || folder.name,
      folderPath: folder.path,
      taskType: taskType,
      isMine: assignees.includes(userName) ? 'yes' : '',
      active,
    }))

  const grouped = groupResult(parsed, 'name')

  return grouped
}

export default parseTasksList
