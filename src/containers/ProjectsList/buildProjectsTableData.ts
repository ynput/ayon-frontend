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
      },
      subRows: [],
      // helper property for sorting
      _isPinned: pinnedProjects.includes(project.name),
    }))
    .sort((a, b) => {
      // Sort by pinned first, then alphabetically
      if (a._isPinned && !b._isPinned) return -1
      if (!a._isPinned && b._isPinned) return 1
      return a.name.localeCompare(b.name)
    })
    .map(({ _isPinned, ...row }) => row) // remove helper property

  return tableRows
}

export default buildProjectsTableData
