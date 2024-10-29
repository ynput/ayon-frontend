import { CSSProperties, useRef } from 'react'
import { TablePanel, Section } from '@ynput/ayon-react-components'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useListProjectsQuery } from '@queries/project/getProject'
import styled from 'styled-components'
import clsx from 'clsx'
import useTableLoadingData from '@hooks/useTableLoadingData'
import { $Any } from '@types'
import { CheckboxWidget } from '@containers/SettingsEditor/Widgets/CheckboxWidget'

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
  style: CSSProperties
  className: string
  selection: string[]
  onSelectionChange: () => {}
}

const ProjectList = ({ selection, style, className, onSelectionChange }: Props) => {

  const { data: projects = [], isLoading, isError, error } = useListProjectsQuery({})
  if (isError) {
    console.error(error)
  }

  const projectListWithPinned = projects
  const projectList = projectListWithPinned
  const tableData = useTableLoadingData(projectList, isLoading, 10, 'name')

  return (
    <Section className={clsx(className)}>
      <TablePanel>
        <DataTable
          value={tableData}
          selection={selection}
          multiple={true}
          scrollable={true}
          scrollHeight="flex"
          className={clsx({ loading: isLoading })}
          rowClassName={() => ({ loading: isLoading })}
          onSelectionChange={() => {
            console.log('change??')
            return onSelectionChange
          }}
        >
          <Column
            field="name"
            header="Projects"
            body={(rowData) => (
              <StyledProjectName>
                <span>{formatName(rowData, 'name')}</span>
              </StyledProjectName>
            )}
            style={{ minWidth: 150, ...style }}
          />
          <Column
            field="code"
            header="Code"
            body={(rowData) => (
              <StyledProjectName>
                <span>{formatName(rowData, 'code')}</span>
              </StyledProjectName>
            )}
            style={{ minWidth: 150, ...style }}
          />
          <Column
            field="enabled"
            header="Enabled"
            body={() => (
              <StyledProjectName>
                <CheckboxWidget
                  value={true}
                  disabled={false}
                  onClick={() => {}}
                />
              </StyledProjectName>
            )}
            style={{ minWidth: 150, ...style }}
          />
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default ProjectList
