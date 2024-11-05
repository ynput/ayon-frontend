import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useListProjectsQuery } from '@queries/project/getProject'
import styled from 'styled-components'
import clsx from 'clsx'
import useTableLoadingData from '@hooks/useTableLoadingData'
import { $Any } from '@types'
import { useRef } from 'react'
import { TablePanel } from '@ynput/ayon-react-components'

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

  &:not(.isActive) {
    font-style: italic;
    color: var(--md-ref-palette-secondary50);
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
  className: string
  selection: string[]
  onSelectionChange: (selection: $Any) => {}
}

const ProjectList = ({ selection, onSelectionChange }: Props) => {
  const tableRef = useRef(null)
  const { data: projects = [], isLoading, isError, error } = useListProjectsQuery({})
  if (isError) {
    console.error(error)
  }

  const projectList = projects
  const tableData = useTableLoadingData(projectList, isLoading, 10, 'name')
  console.log('td: ', tableData)
  console.log('sel: ', selection)

  return (
      <TablePanel>

    <DataTable
      ref={tableRef}
      value={tableData}
      selection={selection}
      multiple={true}
      scrollable={true}
      scrollHeight="flex"
      className={clsx({ loading: isLoading })}
      rowClassName={() => ({ loading: isLoading })}
      onSelectionChange={(selection) => {
        console.log(selection)
        return onSelectionChange(selection.value)
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

export default ProjectList
