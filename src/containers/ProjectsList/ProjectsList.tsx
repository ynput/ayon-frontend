import { useListProjectsQuery } from '@shared/api'
import SimpleTable, { Container, SimpleTableProvider } from '@shared/SimpleTable'
import { RowSelectionState } from '@tanstack/react-table'
import { FC, useCallback, useMemo, useState } from 'react'
import buildProjectsTableData from './buildProjectsTableData'
import ProjectsListTableHeader from './ProjectsListTableHeader'

interface ProjectsListProps {
  selection: string[]
  onSelect: (ids: string[]) => void
  showInactive?: boolean
  pt?: {
    container?: React.HTMLAttributes<HTMLDivElement>
  }
}

const ProjectsList: FC<ProjectsListProps> = ({ selection, onSelect, showInactive, pt }) => {
  const { data: projects = [], isLoading, error } = useListProjectsQuery({ active: !showInactive })

  //   format data for the table
  const listsTableData = useMemo(() => buildProjectsTableData(projects), [projects])

  // state
  // search state
  const [clientSearch, setClientSearch] = useState<null | string>(null)
  // convert selection to RowSelectionState
  const rowSelection: RowSelectionState = useMemo(
    () =>
      selection.reduce((acc, id) => {
        acc[id] = true
        return acc
      }, {} as RowSelectionState),
    [selection],
  )

  // handle selection change
  const setRowSelection = useCallback(
    (newSelection: RowSelectionState) => {
      const selectedIds = Object.keys(newSelection).filter((id) => newSelection[id])
      onSelect(selectedIds)
    },
    [onSelect],
  )

  console.log('helloooo?')

  return (
    <SimpleTableProvider {...{ rowSelection, onRowSelectionChange: setRowSelection }}>
      <Container {...pt?.container}>
        <ProjectsListTableHeader
          title={'Projects'}
          // hiddenButtons={['add']}
          search={clientSearch}
          onSearch={setClientSearch}
          selection={selection}
        />
        <SimpleTable
          data={listsTableData}
          globalFilter={clientSearch ?? undefined}
          isExpandable={false}
          isLoading={isLoading}
          error={error ? (error as string) : undefined}
          meta={
            {
              //   handleRowContext,
              //   handleValueDoubleClick,
              //   closeRenameList,
              //   submitRenameList,
              //   renamingList,
            }
          }
        ></SimpleTable>
      </Container>
    </SimpleTableProvider>
  )
}

export default ProjectsList
