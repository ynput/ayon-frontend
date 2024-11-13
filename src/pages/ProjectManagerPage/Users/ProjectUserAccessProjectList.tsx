import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import styled from 'styled-components'
import clsx from 'clsx'
import useTableLoadingData from '@hooks/useTableLoadingData'
import { $Any } from '@types'
import { TablePanel } from '@ynput/ayon-react-components'
import { ProjectNode } from '@api/graphql'
import { UserPermissions, UserPermissionsEntity } from '@hooks/useUserProjectPermissions'

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
  projects: ProjectNode[]
  selection: string[]
  isLoading: boolean
  userPermissions: UserPermissions
  onSelectionChange: (selection: $Any) => void
}

const ProjectUserAccessProjectList = ({ projects, isLoading, selection, userPermissions, onSelectionChange }: Props) => {
  const tableData = useTableLoadingData(projects, isLoading, 10, 'name')
  const selected = tableData.filter((project: ProjectNode) => selection.includes(project.name))

  return (
    <TablePanel style={{ height: '100%' }}>
      <DataTable
        value={tableData.sort((a: ProjectNode, b: ProjectNode) => {
          const aPerm = userPermissions.canView(UserPermissionsEntity.users, a.name) ? 1 : -1
          const bPerm = userPermissions.canView(UserPermissionsEntity.users, b.name) ? 1 : -1
          const mainComparison = bPerm - aPerm
          if (mainComparison !== 0) {
            return mainComparison
          }

          return a.name.localeCompare(b.name)
        })}
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
          body={(rowData) => {
          const isActive = userPermissions.canView(UserPermissionsEntity.users, rowData.name)
            return (
              <StyledProjectName className={clsx({ isActive })}>
                <span>{formatName(rowData, 'name')}</span>
              </StyledProjectName>
            )
          }}
          style={{ minWidth: 150 }}
        />
      </DataTable>
    </TablePanel>
  )
}

export default ProjectUserAccessProjectList
