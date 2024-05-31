import getEntityTypeIcon from '/src/helpers/getEntityTypeIcon'

const getMentionTasks = (tasks = [], taskTypes = [], singleProjectName) =>
  tasks.map((task) => ({
    type: 'task',
    id: task.id,
    label: task.label,
    context: task.folderLabel,
    icon: taskTypes.find((type) => type.name === task.taskType)?.icon || getEntityTypeIcon('task'),
    keywords: [task.name],
    image: task.thumbnailId || task.versions?.edges[0]?.node?.thumbnailId,
    projectName: singleProjectName,
  }))

export default getMentionTasks
