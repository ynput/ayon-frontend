import SimpleTable, { Container, SimpleTableProvider } from '@shared/containers/SimpleTable'
import { RowSelectionState, ExpandedState, RowPinningState } from '@tanstack/react-table'
import { FC, useCallback, Dispatch, SetStateAction } from 'react'
import ProjectsListRow from './ProjectsListRow'
import ProjectsListTableHeader from './ProjectsListTableHeader'
import { useCreateContextMenu } from '@shared/containers'

type ButtonType = 'delete' | 'add' | 'filter' | 'search' | 'select-all'

interface ProjectsTableProps {
  data: any[]
  isLoading?: boolean
  error?: string | undefined
  search?: string | undefined
  onSearch?: (search: string | undefined) => void
  rowSelection: RowSelectionState
  onRowSelectionChange: (newSelection: RowSelectionState) => void
  rowPinning: string[]
  onRowPinningChange?: (pinning: RowPinningState) => void
  expanded: ExpandedState
  setExpanded: Dispatch<SetStateAction<ExpandedState>>
  multiSelect?: boolean
  readonly?: boolean
  buildMenuItems?: (selection: string[], options?: any) => any[]
  selection: string[]
  onSelect?: (ids: string[]) => void
  onOpenProject?: (projectName: string) => void
  title?: string
  showAddProject?: boolean
  onNewProject?: () => void
  toggleMenu?: (open?: boolean) => void
  onSelectAll?: () => void
  hiddenButtons?: ButtonType[]
  renamingFolder?: string | null
  onSubmitRenameFolder?: (value: string) => void
  closeRenameFolder?: () => void
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
  rowSelection,
  onRowSelectionChange,
  rowPinning,
  onRowPinningChange,
  expanded,
  setExpanded,
  multiSelect,
  readonly = false,
  buildMenuItems,
  selection,
  onSelect,
  onOpenProject,
  title = 'Projects',
  showAddProject,
  onNewProject,
  toggleMenu,
  onSelectAll,
  hiddenButtons = [],
  renamingFolder,
  onSubmitRenameFolder,
  closeRenameFolder,
  containerClassName,
  pt,
}) => {
  // create the ref and model
  const [ctxMenuShow] = useCreateContextMenu()

  const handleRowContext = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (readonly) return

      e.preventDefault()
      e.stopPropagation()

      let newSelection: string[] = [...selection]
      // if we are selecting a row outside of the selection (or none), set the selection to the row
      if (!newSelection.includes(e.currentTarget.id)) {
        newSelection = [e.currentTarget.id]
        onSelect?.(newSelection)
      }
      const newSelectedRows = newSelection

      // build menu items based on selection
      if (buildMenuItems) {
        const menuItems = buildMenuItems(newSelectedRows, {
          command: true,
          dividers: false,
          hidden: {
            'add-project': true,
            search: true,
            'select-all': true,
          },
        })

        ctxMenuShow(e, menuItems)
      }
    },
    [ctxMenuShow, buildMenuItems, selection, onSelect, readonly],
  )

  return (
    <SimpleTableProvider
      {...{
        rowSelection,
        onRowSelectionChange,
        rowPinning: { top: rowPinning },
        onRowPinningChange,
        expanded,
        setExpanded,
      }}
    >
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
        <SimpleTable
          data={data}
          globalFilter={search ?? undefined}
          isExpandable={true}
          isLoading={!!isLoading}
          isMultiSelect={multiSelect}
          error={error}
          enableClickToDeselect={false}
          enableNonFolderIndent={true}
          meta={{
            handleRowContext: readonly ? undefined : handleRowContext,
            renamingFolder,
            onSubmitRenameFolder,
            closeRenameFolder,
          }}
        >
          {(props, row, table) => (
            <ProjectsListRow
              {...props}
              id={row.id}
              onContextMenu={readonly ? undefined : table.options.meta?.handleRowContext}
              code={row.original.data.code}
              isPinned={row.getIsPinned() === 'top'}
              onPinToggle={
                readonly ? undefined : () => row.pin(row.getIsPinned() === 'top' ? false : 'top')
              }
              inactive={row.original.data.active === false}
              onDoubleClick={
                readonly
                  ? undefined
                  : row.original.data?.isFolder
                    ? undefined
                    : () => onOpenProject?.(row.original.name)
              }
              isTableExpandable={props.isTableExpandable}
              isRowExpandable={row.getCanExpand()}
              isRowExpanded={row.getIsExpanded()}
              onExpandClick={row.getToggleExpandedHandler()}
              isRenaming={row.id === table.options.meta?.renamingFolder}
              onSubmitRename={(v) => table.options.meta?.onSubmitRenameFolder?.(v)}
              onCancelRename={table.options.meta?.closeRenameFolder}
              count={row.original.data.count}
            />
          )}
        </SimpleTable>
      </Container>
    </SimpleTableProvider>
  )
}

export default ProjectsTable
