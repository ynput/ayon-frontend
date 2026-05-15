import { FC, useState } from 'react'
import { useGetProjectsData, useProjectColumns } from './hooks'
import { DataTable } from '@shared/containers/ListTable'

interface ProjectsPageProps {}

export const ProjectsPage: FC<ProjectsPageProps> = ({}) => {
  const { tableRows, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetProjectsData({
    showArchived: false,
    groupBy: undefined,
    groupByDesc: undefined,
  })

  const columns = useProjectColumns(tableRows)

  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])

  return (
    <DataTable
      data={tableRows}
      columns={columns}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      selectedRows={selectedProjectIds}
      onSelectedRowsChange={setSelectedProjectIds}
      onUpdateRow={() => {}}
      onOpenViewer={() => {}}
      onReorderRows={() => {}}
    />
  )
}
