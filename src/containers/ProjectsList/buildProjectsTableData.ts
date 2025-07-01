import { ListProjectsItemModel } from '@shared/api'
import { SimpleTableRow } from '@shared/SimpleTable'

const buildProjectsTableData = (
  projects: ListProjectsItemModel[],
  pinnedProjects: string[] = [],
): SimpleTableRow[] => {
  const tableRows: SimpleTableRow[] = projects
    .map((project) => ({
      id: project.name,
      name: project.name,
      label: project.name,
      data: {
        id: project.name,
        active: project.active,
      },
      subRows: [],
      // helper property for sorting
      _isPinned: pinnedProjects.includes(project.name) && project.active,
    }))
    .sort((a, b) => {
      // All inactive (active=false) are last
      if (!a.data.active && b.data.active) return 1
      if (a.data.active && !b.data.active) return -1

      // Among active, pinned first
      if (a.data.active && b.data.active) {
        if (a._isPinned && !b._isPinned) return -1
        if (!a._isPinned && b._isPinned) return 1
        return a.name.localeCompare(b.name)
      }

      // Both inactive: sort by name
      return a.name.localeCompare(b.name)
    })

  return tableRows
}

export default buildProjectsTableData
