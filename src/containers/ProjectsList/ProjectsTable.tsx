import {
  Container,
  SimpleTableProvider,
  SimpleTableRow,
  SimpleTableRowContextMenuBuilder,
} from '@shared/containers/SimpleTable'
import { RowSelectionState, ExpandedState, RowPinningState } from '@tanstack/react-table'
import { FC, Dispatch, SetStateAction, useMemo } from 'react'
import ProjectsListTableHeader from './ProjectsListTableHeader'
import { ProjectsSimpleTable } from './ProjectsSimpleTable'
import { PinnedDivider } from './ProjectsListRow.styled'
import { useSessionStorage } from '@shared/hooks'

type ButtonType = 'delete' | 'add' | 'filter' | 'search' | 'select-all'

interface ProjectsTableProps {
  data: SimpleTableRow[]
  isLoading?: boolean
  error?: string | undefined
  search?: string | undefined
  onSearch?: (search: string | undefined) => void
  rowSelection?: RowSelectionState
  onRowSelectionChange?: (newSelection: RowSelectionState) => void
  rowPinning: string[]
  onRowPinningChange?: (pinning: RowPinningState) => void
  expanded: ExpandedState
  setExpanded: Dispatch<SetStateAction<ExpandedState>>
  multiSelect?: boolean
  readonly?: boolean
  buildMenuItems?: (selection: string[], options?: any) => any[]
  rowContextMenuBuilders?: SimpleTableRowContextMenuBuilder[]
  selection: string[]
  onSelect?: (ids: string[]) => void
  onOpenProject?: (projectName: string) => void
  onSettingsClick?: (projectId: string) => void
  title?: string
  showAddProject?: boolean
  onNewProject?: () => void
  toggleMenu?: (open?: boolean) => void
  onSelectAll?: () => void
  hiddenButtons?: ButtonType[]
  renamingFolder?: string | null
  onSubmitRenameFolder?: (value: string) => void
  closeRenameFolder?: () => void
  renamingProject?: string | null
  onSubmitRenameProject?: (value: string) => void
  closeRenameProject?: () => void
  containerClassName?: string
  pt?: {
    container?: React.HTMLAttributes<HTMLDivElement>
  }
}

const ProjectsTable: FC<ProjectsTableProps> = ({
  data,
  isLoading,
  error,
  search,
  onSearch,
  onRowSelectionChange,
  rowPinning,
  onRowPinningChange,
  expanded,
  setExpanded,
  multiSelect,
  readonly = false,
  buildMenuItems,
  rowContextMenuBuilders = [],
  selection,
  onSelect,
  onOpenProject,
  onSettingsClick,
  title = 'Projects',
  showAddProject,
  onNewProject,
  toggleMenu,
  onSelectAll,
  hiddenButtons = [],
  renamingFolder,
  onSubmitRenameFolder,
  closeRenameFolder,
  renamingProject,
  onSubmitRenameProject,
  closeRenameProject,
  containerClassName,
  pt,
}) => {
  // Track which table has active selection: 'pinned' | 'all'
  const [activeTable, setActiveTable] = useSessionStorage<'pinned' | 'all'>(
    'project-list-selection',
    'all',
  )

  // Derive row selection for each table from selection prop
  const selectionState = selection.reduce((acc, id) => {
    acc[id] = true
    return acc
  }, {} as RowSelectionState)

  const pinnedSelection = activeTable === 'pinned' ? selectionState : {}
  const allProjectsSelection = activeTable === 'all' ? selectionState : {}

  const handlePinnedSelectionChange = (newSelection: RowSelectionState) => {
    setActiveTable('pinned')
    const ids = Object.keys(newSelection).filter((id) => newSelection[id])
    onSelect?.(ids)
    onRowSelectionChange?.(newSelection)
  }

  const handleAllProjectsSelectionChange = (newSelection: RowSelectionState) => {
    setActiveTable('all')
    const ids = Object.keys(newSelection).filter((id) => newSelection[id])
    onSelect?.(ids)
    onRowSelectionChange?.(newSelection)
  }

  const pinnedContextMenuBuilders = useMemo(
    () => [
      ...rowContextMenuBuilders,
      (() => {
        setActiveTable('pinned')
        return []
      }) as SimpleTableRowContextMenuBuilder,
    ],
    [rowContextMenuBuilders, setActiveTable],
  )

  const allProjectsContextMenuBuilders = useMemo(
    () => [
      ...rowContextMenuBuilders,
      (() => {
        setActiveTable('all')
        return []
      }) as SimpleTableRowContextMenuBuilder,
    ],
    [rowContextMenuBuilders, setActiveTable],
  )

  // Wrap onRowPinningChange to switch activeTable when selected project is unpinned
  const handleRowPinningChange = (newPinning: RowPinningState) => {
    const newPinnedList = newPinning?.top || []
    // If active table is 'pinned' and the selected project is no longer pinned, switch to 'all'
    if (activeTable === 'pinned' && selection.length > 0) {
      const selectedProjectStillPinned = selection.some((id) => newPinnedList.includes(id))
      if (!selectedProjectStillPinned) {
        setActiveTable('all')
      }
    }
    onRowPinningChange?.(newPinning)
  }

  const pinnedSet = new Set(rowPinning)

  const pinnedProjects = data.flatMap(function collectPinned(row): SimpleTableRow[] {
    const result: SimpleTableRow[] = []
    if (pinnedSet.has(row.name)) result.push(row)
    if (row.subRows?.length) result.push(...row.subRows.flatMap(collectPinned))
    return result
  })

  return (
    <Container
      {...pt?.container}
      className={containerClassName}
      style={{ height: '100%', minWidth: 50, ...pt?.container?.style }}
    >
      {!readonly && onSearch && (
        <ProjectsListTableHeader
          title={title}
          search={search}
          onSearch={onSearch}
          showAddProject={showAddProject}
          onNewProject={onNewProject}
          menuItems={buildMenuItems?.(selection)}
          toggleMenu={toggleMenu}
          onSelectAll={onSelectAll}
          hiddenButtons={hiddenButtons}
        />
      )}
      {pinnedProjects.length > 0 && !search && (
        <SimpleTableProvider
          {...{
            rowSelection: pinnedSelection,
            onRowSelectionChange: handlePinnedSelectionChange,
            rowPinning: { top: rowPinning },
            onRowPinningChange: handleRowPinningChange,
            expanded,
            setExpanded,
          }}
        >
          <ProjectsSimpleTable
            tableData={pinnedProjects}
            search={search}
            isLoading={isLoading}
            multiSelect={multiSelect}
            error={error}
            readonly={readonly}
            rowContextMenuBuilders={pinnedContextMenuBuilders}
            renamingFolder={renamingFolder}
            onSubmitRenameFolder={onSubmitRenameFolder}
            closeRenameFolder={closeRenameFolder}
            renamingProject={renamingProject}
            onSubmitRenameProject={onSubmitRenameProject}
            closeRenameProject={closeRenameProject}
            onOpenProject={onOpenProject}
            onSettingsClick={onSettingsClick}
            fitContent
            className="pinned-projects"
          />
          <PinnedDivider />
        </SimpleTableProvider>
      )}
      <SimpleTableProvider
        {...{
          rowSelection: allProjectsSelection,
          onRowSelectionChange: handleAllProjectsSelectionChange,
          rowPinning: { top: rowPinning },
          onRowPinningChange: handleRowPinningChange,
          expanded,
          setExpanded,
        }}
      >
        <ProjectsSimpleTable
          tableData={data}
          search={search}
          isLoading={isLoading}
          multiSelect={multiSelect}
          error={error}
          readonly={readonly}
          rowContextMenuBuilders={allProjectsContextMenuBuilders}
          renamingFolder={renamingFolder}
          onSubmitRenameFolder={onSubmitRenameFolder}
          closeRenameFolder={closeRenameFolder}
          renamingProject={renamingProject}
          onSubmitRenameProject={onSubmitRenameProject}
          closeRenameProject={closeRenameProject}
          onOpenProject={onOpenProject}
          onSettingsClick={onSettingsClick}
          hidePinned={!search}
          className="all-projects"
        />
      </SimpleTableProvider>
    </Container>
  )
}

export default ProjectsTable
