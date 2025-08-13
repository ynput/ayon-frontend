import { ListProjectsItemModel } from '@shared/api'
import { SimpleTableRow } from '@shared/containers/SimpleTable'

const buildProjectsTableData = (projects: ListProjectsItemModel[]): SimpleTableRow[] => {
  const tableRows: SimpleTableRow[] = projects.map((project) => ({
    id: project.name,
    name: project.name,
    label: project.name,
    data: {
      id: project.name,
      active: project.active,
      code: project.code || project.name,
    },
    subRows: [],
  }))

  return tableRows
}

export default buildProjectsTableData
