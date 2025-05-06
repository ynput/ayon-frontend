import type { ProjectModel, FolderType, TaskType, Status, Tag, LinkTypeModel } from '@shared/api'

type ProjectInfo = {
  folderTypes: FolderType[]
  taskTypes: TaskType[]
  statuses: Status[]
  tags: Tag[]
  linkTypes: LinkTypeModel[]
}

// takes multiple project infos from different projects and merges them into a single object
// based on the projects provided
const mergeProjectInfo = (
  projectsInfo: Record<string, ProjectModel | undefined>,
  projects: string[],
): ProjectInfo => {
  // If there are no project infos or project names, return empty object
  if (!projectsInfo || Object.keys(projectsInfo).length === 0 || !projects?.length) {
    return {
      folderTypes: [],
      taskTypes: [],
      statuses: [],
      tags: [],
      linkTypes: [],
    }
  }

  // If there's only one project name, return its info directly
  if (projects.length === 1) {
    const model = projectsInfo[projects[0]]
    return {
      folderTypes: model?.folderTypes || [],
      taskTypes: model?.taskTypes || [],
      statuses: model?.statuses || [],
      tags: model?.tags || [],
      linkTypes: model?.linkTypes || [],
    }
  }

  // Start with an empty result object
  const result: ProjectInfo = {} as ProjectInfo

  // Helper function to merge arrays by a key property (typically 'name')
  const mergeArraysByKey = <T extends { name: string }>(arrays: T[][]): T[] => {
    const itemMap: Record<string, T> = {}

    // Flatten all arrays and keep the last occurrence of each item by key
    arrays.flat().forEach((item: T) => {
      if (item && item.name) {
        itemMap[item.name] = item
      }
    })

    // Convert back to array
    return Object.values(itemMap)
  }

  // Define types for array properties

  // Collect array properties from all projects
  const arrayProps: { [K in keyof ProjectInfo]: ProjectInfo[K][] } = {
    statuses: [],
    folderTypes: [],
    taskTypes: [],
    tags: [],
    linkTypes: [],
  }

  // Only process projects that are in projects
  projects.forEach((projectName) => {
    const projectInfo = projectsInfo[projectName]
    if (!projectInfo) return // Collect array properties
    ;(Object.keys(arrayProps) as Array<keyof typeof arrayProps>).forEach((prop) => {
      if (Array.isArray(projectInfo[prop])) {
        arrayProps[prop].push(projectInfo[prop] as any)
      }
    })

    // Merge non-array properties (shallow)
    Object.keys(projectInfo).forEach((key) => {
      if (!(key in arrayProps)) {
        ;(result as any)[key] = projectInfo[key as keyof typeof projectInfo]
      }
    })
  })

  // Merge the collected arrays
  ;(Object.keys(arrayProps) as Array<keyof typeof arrayProps>).forEach((prop) => {
    if (arrayProps[prop].length > 0) {
      ;(result as any)[prop] = mergeArraysByKey(arrayProps[prop])
    }
  })

  return result
}

export default mergeProjectInfo
