const getMentionTasks = (tasks = []) =>
  tasks.map((task) => ({
    id: task.id,
    label: task.name,
    keywords: [task.name],
    image: task.thumbnailUrl,
  }))

export default getMentionTasks
