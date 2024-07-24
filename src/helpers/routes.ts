type Task = {
  name: string
  projectName: string
  folderPath: string
}

const getTaskRoute = (task: Task): string =>
  `ayon+entity://${task.projectName}/${task.folderPath}?task=${task.name}`

export type { Task }
export { getTaskRoute }
