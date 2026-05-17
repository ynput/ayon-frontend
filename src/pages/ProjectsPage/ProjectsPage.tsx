import { FC, useState } from 'react'
import { useGetProjectsData, useProjectColumns } from './hooks'
import { ListTable } from '@shared/containers/ListTable'
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

  const columns = useProjectColumns(tableRows)

  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])

  return (
    <Styled.PageContainer>
      <ListTable
        data={tableRows}
        columns={columns}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        selectedRows={selectedProjectIds}
        onSelectedRowsChange={setSelectedProjectIds}
        onUpdateRow={() => {}}
        onOpenViewer={() => {}}
        onReorderRows={() => {}}
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
