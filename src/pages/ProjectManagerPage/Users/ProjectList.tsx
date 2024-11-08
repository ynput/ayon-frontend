import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useListProjectsQuery } from '@queries/project/getProject'
import styled from 'styled-components'
import clsx from 'clsx'
import useTableLoadingData from '@hooks/useTableLoadingData'
import { $Any } from '@types'
import { useRef } from 'react'
import { TablePanel } from '@ynput/ayon-react-components'
import { ProjectNode } from '@api/graphql'
import { Filter } from '@components/SearchFilter/types'

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
  className: string
  selection: string[]
  filters: Filter[]
  setSelection: $Any
  onSelectionChange: (selection: $Any) => void
}

const ProjectList = ({ selection, onSelectionChange, filters }: Props) => {
  console.log('filters', filters)
  const { data: projects = [], isLoading, isError, error } = useListProjectsQuery({})
  if (isError) {
    console.error(error)
  }

  const getFilteredProjects = (projects: ProjectNode[], filters: Filter) => {
    if (!filters) {
      return projects
    }

    const filterProjects = filters && filters.values!.map((match: Filter) => match.id)
    if (filters!.inverted) {
      return projects.filter((project: ProjectNode) => !filterProjects.includes(project.name))
    }
    return projects.filter((project: ProjectNode) => filterProjects.includes(project.name))
  }

  // @ts-ignore
  const projectList = getFilteredProjects(projects, filters)
  const tableData = useTableLoadingData(projectList, isLoading, 10, 'name')
  const selected = tableData.filter((project: ProjectNode) => selection.includes(project.name))

  return (
    <TablePanel>
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
          console.log(selection)
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

export default ProjectList
