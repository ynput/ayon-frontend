import { useMemo } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import styled from 'styled-components'
import clsx from 'clsx'
import useTableLoadingData from '@hooks/useTableLoadingData'
import { $Any } from '@types'
import { TablePanel } from '@ynput/ayon-react-components'
import { ProjectNode } from '@shared/api'
import { getProjectDisplayName } from '@shared/util'
import { UserPermissions, UserPermissionsEntity } from '@hooks/useUserProjectPermissions'

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

const formatName = (rowData: ProjectNode, userPermissions: UserPermissions) => {
  const readOnly =
    !userPermissions.canEdit(UserPermissionsEntity.access, rowData.name) &&
    userPermissions.canView(UserPermissionsEntity.access, rowData.name)
  return getProjectDisplayName(rowData) + (readOnly ? ' (read only)' : '')
}

type Props = {
  projects: ProjectNode[]
  selection: string[]
  isLoading: boolean
  userPermissions: UserPermissions
  onSelectionChange: (selection: $Any) => void
}

const ProjectUserAccessProjectList = ({
  projects,
  isLoading,
  selection,
  userPermissions,
  onSelectionChange,
}: Props) => {
  const tableData = useTableLoadingData(projects, isLoading, 10, 'name')
  const selected = tableData.filter((project: ProjectNode) => selection.includes(project.name))

  // active first, then editable, then by display name.
  // Sort keys are computed once per project and the result is memoized, instead of sorting in place on every render.
  const sortedData = useMemo(() => {
    const keyed = tableData.map((project: ProjectNode) => ({
      project,
      rank:
        (project.active ? 10 : -10) +
        (userPermissions.canEdit(UserPermissionsEntity.access, project.name) ? 1 : -1),
      displayName: getProjectDisplayName(project),
    }))

    keyed.sort(
      (a: { rank: number; displayName: string }, b: { rank: number; displayName: string }) =>
        b.rank - a.rank || a.displayName.localeCompare(b.displayName),
    )

    return keyed.map(({ project }: { project: ProjectNode }) => project)
  }, [tableData, userPermissions])

  return (
    <TablePanel data-testid={`projectPanel`} style={{ height: '100%' }}>
      <DataTable
        value={sortedData}
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
            const isActive = rowData.active
            const hasPermissions =
              userPermissions.canEdit(UserPermissionsEntity.access, rowData.name) ||
              userPermissions.canView(UserPermissionsEntity.access, rowData.name)
            return (
              <StyledProjectName className={clsx({ isActive: isActive && hasPermissions })}>
                <span>{formatName(rowData, userPermissions)}</span>
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
