import { Status } from '@shared/api'

// Define the reusable function
const getAllProjectStatuses = (
  projectsInfo: Record<string, { statuses?: Status[] } | undefined>,
  inProjects?: string[],
): Status[] => {
  let allStatuses = Object.entries(projectsInfo)
    .filter(([name]) => (inProjects ? inProjects.includes(name) : true))
    .map(([, p]) => p?.statuses || [])
    .flat()
  // find out duplicates
  const uniqueStatuses = new Map(allStatuses.map((status) => [status.name, status]))
  return Array.from(uniqueStatuses.values())
}

export default getAllProjectStatuses
