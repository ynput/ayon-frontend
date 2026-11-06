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

// the same rows as the projects list of the other project manager pages: no dividers, rounded
// highlights and the project code on the right
const StyledTablePanel = styled(TablePanel)`
  --color-table-row: transparent;
  --color-table-row-hover: transparent;
  --color-table-border: transparent;

  .p-datatable .p-datatable-tbody > tr {
    &.p-highlight,
    &.p-highlight:hover {
      background: transparent !important;
    }

    & > td {
      /* 1px apart and 4px in from the panel edges */
      border: solid transparent;
      border-width: 1px 4px;
      background-clip: padding-box;
      border-radius: var(--border-radius-m);
      padding: 0 4px;
    }

    &:hover > td {
      background-color: var(--md-sys-color-surface-container-hover);
    }

    &.p-highlight > td {
      background-color: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
    }

    &.p-highlight:hover > td {
      background-color: var(--md-sys-color-primary-container-hover);
    }
  }
`

const StyledProjectName = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);
  min-width: 0;

  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .code {
    flex-shrink: 0;
    padding-right: 4px;
    color: var(--md-sys-color-outline);
  }

  &:not(.isActive) .name {
    font-style: italic;
    color: var(--md-ref-palette-secondary50);
  }

  tr.p-highlight & .name {
    font-weight: 600;
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
    <StyledTablePanel data-testid={`projectPanel`} style={{ height: '100%' }}>
      <DataTable
        value={sortedData}
        selection={selected}
        multiple={true}
        scrollable={true}
        scrollHeight="flex"
        selectionMode="multiple"
        // one column under the panel's "Projects" title: a column header would repeat it
        showHeaders={false}
        className={clsx({ loading: isLoading })}
        rowClassName={() => ({ loading: isLoading })}
        onSelectionChange={(selection) => {
          onSelectionChange(selection.value.map((project: ProjectNode) => project.name))
        }}
      >
        <Column
          field="name"
          body={(rowData) => {
            const isActive = rowData.active
            const hasPermissions =
              userPermissions.canEdit(UserPermissionsEntity.access, rowData.name) ||
              userPermissions.canView(UserPermissionsEntity.access, rowData.name)
            return (
              <StyledProjectName className={clsx({ isActive: isActive && hasPermissions })}>
                <span className="name">{formatName(rowData, userPermissions)}</span>
                <span className="code">{rowData.code}</span>
              </StyledProjectName>
            )
          }}
          style={{ minWidth: 150 }}
        />
      </DataTable>
    </StyledTablePanel>
  )
}

export default ProjectUserAccessProjectList
