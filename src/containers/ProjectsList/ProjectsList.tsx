import { useListProjectsQuery } from '@shared/api'
import SimpleTable, { Container, SimpleTableProvider } from '@shared/SimpleTable'
import { RowSelectionState } from '@tanstack/react-table'
import { FC, useCallback, useEffect, useMemo } from 'react'
import useUserProjectPermissions from '@hooks/useUserProjectPermissions'
import buildProjectsTableData from './buildProjectsTableData'
import ProjectsListTableHeader, { MENU_ID } from './ProjectsListTableHeader'
import ProjectsListRow from './ProjectsListRow'
import useProjectListUserPreferences from './hooks/useProjectListUserPreferences'
import useProjectsListMenuItems from './hooks/useProjectsListMenuItems'
import { toggleMenuOpen } from '@state/context'
import { useAppDispatch } from '@state/store'
import { useQueryParam } from 'use-query-params'

export const PROJECTS_LIST_WIDTH_KEY = 'projects-list-splitter'

interface ProjectsListProps {
  selection: string[]
  onSelect: (ids: string[]) => void
  showInactive?: boolean
  multiSelect?: boolean
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
  multiSelect,
  onNewProject,
  onActivateProject,
  onDeleteProject,
  pt,
}) => {
  const {
    data = [],
    isLoading,
    error,
  } = useListProjectsQuery({ active: showInactive ? undefined : true })

  // GET USER PREFERENCES (moved to hook)
  const { rowPinning = [], onRowPinningChange, user } = useProjectListUserPreferences()

  // transformations
  // sort projects by active pinned, active, inactive (active=false) and then alphabetically
  const projects = useMemo(() => {
    return [...data].sort((a, b) => {
      // Sort by pinned AND active first
      const aPinnedActive = rowPinning.includes(a.name) && a.active
      const bPinnedActive = rowPinning.includes(b.name) && b.active
      if (aPinnedActive && !bPinnedActive) return -1
      if (!aPinnedActive && bPinnedActive) return 1
      // Then by active
      if (a.active && !b.active) return -1
      if (!a.active && b.active) return 1
      return a.name.localeCompare(b.name)
    })
  }, [data, rowPinning])

  const selectedProjects = useMemo(() => {
    return projects.filter((p) => selection.includes(p.name))
  }, [projects, selection])

  // if not multi-select, remove selected projects except the first one
  // if there is no project selected, select the first one
  useEffect(() => {
    if (!multiSelect && selection.length > 1) {
      onSelect([selectedProjects[0].name])
    }
    // if there is no project selected, select the first one
    if (projects.length && !selection.length) {
      onSelect([projects[0].name])
    }
  }, [multiSelect, selection, selectedProjects])

  // Get user permissions
  const { isLoading: userPermissionsLoading, permissions: userPermissions } =
    useUserProjectPermissions(user?.data?.isUser || true)
  // Check if user can create projects
  const canCreateProject =
    (!userPermissionsLoading && userPermissions?.canCreateProject()) ||
    user?.data?.isAdmin ||
    user?.data?.isManager

  // format data for the table, pass pinned projects for sorting
  const listsTableData = useMemo(() => buildProjectsTableData(projects), [projects, rowPinning])

  // state
  // search state
  const [clientSearch, setClientSearch] = useQueryParam<undefined | string>('project_search')
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

  const toggleSelectAll = () => {
    // select all projects
    if (onSelect) {
      if (selection.length === projects.length) {
        onSelect([]) // Deselect all
      } else {
        const allIds = projects.map((p) => p.name)
        onSelect(allIds) // Select all
      }
    }
  }

  // Generate menu items using the hook
  const menuItems = useProjectsListMenuItems({
    hidden: {
      'add-project': !canCreateProject,
    },
    projects: projects,
    multiSelect,
    selection,
    pinned: rowPinning,
    onNewProject,
    onSearch: () => setClientSearch(''),
    onPin: (pinned) => onRowPinningChange({ top: pinned }),
    onSelectAll: toggleSelectAll,
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
      <Container
        {...pt?.container}
        style={{ height: '100%', minWidth: 50, ...pt?.container?.style }}
      >
        <ProjectsListTableHeader
          title={'Projects'}
          search={clientSearch}
          onSearch={setClientSearch}
          // project creation
          showAddProject={canCreateProject}
          onNewProject={onNewProject}
          menuItems={menuItems}
          toggleMenu={toggleMenu}
          onSelectAll={toggleSelectAll}
          hiddenButtons={!multiSelect ? ['select-all'] : []}
        />
        <SimpleTable
          data={listsTableData}
          globalFilter={clientSearch ?? undefined}
          isExpandable={false}
          isLoading={isLoading}
          isMultiSelect={multiSelect}
          error={error ? (error as string) : undefined}
        >
          {(props, row) => (
            <ProjectsListRow
              {...props}
              code={row.original.data.code}
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
