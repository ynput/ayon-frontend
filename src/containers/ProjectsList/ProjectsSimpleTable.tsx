import ProjectsListRow from '@containers/ProjectsList/ProjectsListRow.tsx'
import SimpleTable, { SimpleTableRow } from '@shared/containers/SimpleTable'
import { FC } from 'react'
import { useNavigate } from 'react-router-dom'

interface ProjectsSimpleTableProps {
  tableData: SimpleTableRow[]
  search?: string
  isLoading?: boolean
  multiSelect?: boolean
  error?: string
  readonly?: boolean
  handleRowContext?: (e: React.MouseEvent<HTMLElement>) => void
  renamingFolder?: string | null
  onSubmitRenameFolder?: (value: string) => void
  closeRenameFolder?: () => void
  onOpenProject?: (projectName: string) => void
  fitContent?: boolean
  hidePinned?: boolean
  onSettingsClick?: (projectId: string) => void
}

export const ProjectsSimpleTable: FC<ProjectsSimpleTableProps> = ({
  tableData,
  search,
  isLoading,
  multiSelect,
  error,
  readonly,
  handleRowContext,
  renamingFolder,
  onSubmitRenameFolder,
  closeRenameFolder,
  onOpenProject,
  fitContent,
  hidePinned,
  onSettingsClick,
}) => {
  const navigate = useNavigate()
  const onSettings = (id: string) => {
    if (onSettingsClick) {
      onSettingsClick(id)
    } else {
      navigate('/manageProjects/projectSettings?project=' + id)
    }
  }
  return (
    <SimpleTable
      data={tableData}
      globalFilter={search ?? undefined}
      isExpandable={tableData.some((row) => row.subRows.length > 0)}
      isLoading={!!isLoading}
      isMultiSelect={multiSelect}
      error={error}
      enableClickToDeselect={false}
      enableNonFolderIndent={true}
      fitContent={fitContent }
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
            isPinned={ row.getIsPinned() === 'top'}
            hidePinned={hidePinned}
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
            onSettingsClick={()=>onSettings(row.id)}
          />
      )}
    </SimpleTable>
  )
};
