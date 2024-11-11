import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import styled from 'styled-components'
import clsx from 'clsx'
import useTableLoadingData from '@hooks/useTableLoadingData'
import { $Any } from '@types'
import { TablePanel } from '@ynput/ayon-react-components'
import { ProjectNode } from '@api/graphql'

const formatName = (rowData: $Any, field: string) => {
  return rowData[field]
}

const StyledProjectName = styled.div`
  /* use grid to stack items on top of each other */
  display: grid;
  grid-template-columns: 1fr;

  span {
    grid-area: 1 / 1 / 2 / 2;
    transition: opacity 0.15s;
  }

  /* when open hide the code */
  span:last-child {
    opacity: 0;
  }

  &:not(.isOpen) {
    span:first-child {
      opacity: 0;
    }
    span:last-child {
      opacity: 1;
    }
  }
`

type Props = {
  projects: ProjectNode[]
  selection: string[]
  isLoading: boolean
  onSelectionChange: (selection: $Any) => void
}

const ProjectUserAccessProjectList = ({ projects, isLoading, selection, onSelectionChange }: Props) => {
  const tableData = useTableLoadingData(projects, isLoading, 10, 'name')
  const selected = tableData.filter((project: ProjectNode) => selection.includes(project.name))

  return (
    <TablePanel style={{ height: '100%' }}>
      <DataTable
        value={tableData}
        selection={selected}
        multiple={true}
        scrollable={true}
        scrollHeight="flex"
        selectionMode="multiple"
        className={clsx({ loading: isLoading })}
        rowClassName={() => ({ loading: isLoading })}
        onSelectionChange={(selection) => {
          onSelectionChange(selection.value.map((project: ProjectNode) => project.name))
        }}
      >
        <Column
          field="name"
          header="Project name"
          body={(rowData) => (
            <StyledProjectName>
              <span>{formatName(rowData, 'name')}</span>
            </StyledProjectName>
          )}
          style={{ minWidth: 150 }}
        />
      </DataTable>
    </TablePanel>
  )
}

export default ProjectUserAccessProjectList
