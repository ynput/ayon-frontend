import { useListProjectsQuery } from '@shared/api'
import SimpleTable, { Container, SimpleTableProvider } from '@shared/SimpleTable'
import { RowSelectionState } from '@tanstack/react-table'
import { FC, useCallback, useMemo, useState } from 'react'
import useUserProjectPermissions from '@hooks/useUserProjectPermissions'
import buildProjectsTableData from './buildProjectsTableData'
import ProjectsListTableHeader, { MENU_ID } from './ProjectsListTableHeader'
import ProjectsListRow from './ProjectsListRow'
import useProjectListUserPreferences from './hooks/useProjectListUserPreferences'
import useProjectsListMenuItems from './hooks/useProjectsListMenuItems'
import { toggleMenuOpen } from '@state/context'
import { useAppDispatch } from '@state/store'

interface ProjectsListProps {
  selection: string[]
  onSelect: (ids: string[]) => void
  showInactive?: boolean
  onNewProject?: () => void
  onActivateProject?: (projectName: string, active: boolean) => void
  onDeleteProject?: (projectName: string) => void
  pt?: {
    container?: React.HTMLAttributes<HTMLDivElement>
  }
}

const ProjectsList: FC<ProjectsListProps> = ({
  selection,
  onSelect,
  showInactive,
  onNewProject,
  onActivateProject,
  onDeleteProject,
  pt,
}) => {
  const {
    data: projects = [],
    isLoading,
    error,
  } = useListProjectsQuery({ active: showInactive ? undefined : true })

  // GET USER PREFERENCES (moved to hook)
  const { rowPinning = [], onRowPinningChange, user } = useProjectListUserPreferences()

  // Get user permissions
  const { isLoading: userPermissionsLoading, permissions: userPermissions } =
    useUserProjectPermissions(user?.data?.isUser || true)
  // Check if user can create projects
  const canCreateProject =
    (!userPermissionsLoading && userPermissions?.canCreateProject()) ||
    user?.data?.isAdmin ||
    user?.data?.isManager

  // format data for the table, pass pinned projects for sorting
  const listsTableData = useMemo(
    () => buildProjectsTableData(projects, rowPinning),
    [projects, rowPinning],
  )

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
  const dispatch = useAppDispatch()
  const toggleMenu = (open: boolean = true) => {
    dispatch(toggleMenuOpen(open ? MENU_ID : false))
  }

  // Generate menu items using the hook
  const menuItems = useProjectsListMenuItems({
    hidden: {
      'add-project': !canCreateProject,
    },
    projects: projects,
    selection,
    onNewProject,
    pinned: rowPinning,
    onPin: (pinned) => onRowPinningChange({ top: pinned }),
    onSelect: (projects) => onSelect(projects),
    onClose: () => toggleMenu(false),
    onArchive: onActivateProject,
    onDelete: onDeleteProject,
  })

  return (
    <SimpleTableProvider
      {...{
        rowSelection,
        onRowSelectionChange: setRowSelection,
        rowPinning: { top: rowPinning },
        onRowPinningChange,
      }}
    >
      <Container {...pt?.container}>
        <ProjectsListTableHeader
          title={'Projects'}
          search={clientSearch}
          onSearch={setClientSearch}
          selection={selection}
          // project creation
          showAddProject={canCreateProject}
          onNewProject={onNewProject}
          menuItems={menuItems}
          toggleMenu={toggleMenu}
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
        >
          {(props, row, table) => (
            <ProjectsListRow
              {...props}
              isPinned={row.getIsPinned() === 'top'}
              onPinToggle={() => row.pin(row.getIsPinned() === 'top' ? false : 'top')}
              isInActive={row.original.data.active === false}
            />
          )}
        </SimpleTable>
      </Container>
    </SimpleTableProvider>
  )
}

export default ProjectsList
