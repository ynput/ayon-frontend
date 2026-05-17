import { FC, useState } from 'react'
import { useGetProjectsData, useProjectColumns, useUpdateProjectTableRow } from './hooks'
import type { ProjectTableRow } from './hooks'
import { getDefaultListTableDataTypeWidgets, ListTable } from '@shared/containers/ListTable'
import * as Styled from './ProjectsPage.styled'
import { Button, Dialog } from '@ynput/ayon-react-components'
import { PROJECTS_PER_PAGE } from '@shared/api'

interface ProjectsPageProps {}

export const ProjectsPage: FC<ProjectsPageProps> = ({}) => {
  const { tableRows, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetProjectsData({
    showArchived: false,
    groupBy: undefined,
    groupByDesc: undefined,
  })

  const { columns, columnAttributeData } = useProjectColumns(tableRows)
  const dataTypeWidgets = getDefaultListTableDataTypeWidgets<ProjectTableRow>()

  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])

  const handleProjectUpdate = useUpdateProjectTableRow(tableRows)

  return (
    <Styled.PageContainer>
      <ListTable<ProjectTableRow>
        data={tableRows}
        columns={columns}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        selectedRows={selectedProjectIds}
        onSelectedRowsChange={setSelectedProjectIds}
        onUpdateRow={handleProjectUpdate}
        onOpenViewer={() => {}}
        onReorderRows={() => {}}
        columnAttributeData={columnAttributeData}
        dataTypeWidgets={dataTypeWidgets}
      />
      {hasNextPage && (
        <Dialog
          size="sm"
          isOpen={true}
          onClose={() => {}}
          hideCancelButton
          showCloseButton={false}
          header={`Congratulations you have more than ${tableRows.length} projects.`}
        >
          <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? 'Loading...' : `Click here to load ${PROJECTS_PER_PAGE} more`}
          </Button>
        </Dialog>
      )}
    </Styled.PageContainer>
  )
}
