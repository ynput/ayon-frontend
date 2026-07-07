import SimpleTable, {
  SimpleTableCellTemplate,
  SimpleTableRow,
  SimpleTableRowContextMenuBuilder,
} from '@shared/containers/SimpleTable'
import { TableRowAction } from '@shared/containers/SimpleTable/SimpleTableRowTemplate'
import { Row } from '@tanstack/react-table'
import { SimpleTableCellTemplateProps } from '@shared/containers/SimpleTable'
import { FC, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseProjectFolderRowId } from './buildProjectsTableData'
import clsx from 'clsx'

interface ProjectsSimpleTableProps extends React.HTMLAttributes<HTMLDivElement> {
  tableData: SimpleTableRow[]
  search?: string
  isLoading?: boolean
  multiSelect?: boolean
  error?: string
  readonly?: boolean
  rowContextMenuBuilders?: SimpleTableRowContextMenuBuilder[]
  renamingFolder?: string | null
  onSubmitRenameFolder?: (value: string) => void
  closeRenameFolder?: () => void
  renamingProject?: string | null
  onSubmitRenameProject?: (value: string) => void
  closeRenameProject?: () => void
  onRenameFolder?: (folderId: string) => void
  onRenameProject?: (projectName: string) => void
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
  rowContextMenuBuilders = [],
  renamingFolder,
  onSubmitRenameFolder,
  closeRenameFolder,
  renamingProject,
  onSubmitRenameProject,
  closeRenameProject,
  onRenameFolder,
  onRenameProject,
  onOpenProject,
  fitContent,
  hidePinned,
  onSettingsClick,
  ...props
}) => {
  const navigate = useNavigate()
  const onSettings = useCallback(
    (id: string) => {
      if (onSettingsClick) {
        onSettingsClick(id)
      } else {
        navigate('/manageProjects/projectSettings?project=' + id)
      }
    },
    [onSettingsClick, navigate],
  )

  const handleRename = useCallback(
    (id: string) => {
      const isFolder = !!parseProjectFolderRowId(id)
      if (isFolder) {
        onRenameFolder?.(id)
      } else {
        onRenameProject?.(id)
      }
    },
    [onRenameFolder, onRenameProject],
  )

  const handleSubmitRename = useCallback(
    (id: string, value: string) => {
      const isFolder = !!parseProjectFolderRowId(id)
      if (isFolder) {
        onSubmitRenameFolder?.(value)
      } else {
        onSubmitRenameProject?.(value)
      }
    },
    [onSubmitRenameFolder, onSubmitRenameProject],
  )

  const handleCancelRename = useCallback(() => {
    closeRenameFolder?.()
    closeRenameProject?.()
  }, [closeRenameFolder, closeRenameProject])

  const renamingId = renamingFolder || renamingProject

  const handleRowDoubleClick = useCallback(
    (id: string) => {
      console.log('onRowDoubleClick', id)
      if (readonly) return
      if (parseProjectFolderRowId(id)) return
      onOpenProject?.(id)
    },
    [readonly, onOpenProject],
  )

  const renderCell = useCallback(
    (props: SimpleTableCellTemplateProps, row: Row<SimpleTableRow>) => {
      const isFolder = !!parseProjectFolderRowId(row.id || '')
      const isPinned = row.getIsPinned() === 'top'

      const hoverActions: TableRowAction[] = !isFolder
        ? [
            {
              icon: 'settings_applications',
              className: 'settings-icon',
              onClick: (e) => {
                e.stopPropagation()
                onSettings?.(row.id)
              },
            },
            {
              icon: 'push_pin',
              className: clsx('pin', { active: isPinned }),
              show: isPinned ? 'always' : 'hover',
              onClick: (e) => {
                e.stopPropagation()
                if (!readonly) {
                  row.pin(isPinned ? false : 'top')
                }
              },
            },
          ]
        : []
      return (
        <SimpleTableCellTemplate
          {...props}
          id={row.id}
          className={clsx(props.className, { pinned: isPinned, hidePinned })}
          hoverActions={hoverActions}
          badge={isFolder ? row.original.data.count : row.original.data.code}
          renamePlaceholder={!isFolder ? 'Project label' : undefined}
          enableNonFolderIndent={false}
          inactive={row.original.data.active === false}
          renameInitialValue={
            row.id === renamingProject ? row.original.data.projectLabel || '' : undefined
          }
        />
      )
    },
    [onSettings, readonly, renamingProject, hidePinned],
  )

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
      fitContent={fitContent}
      rowContextMenuBuilders={readonly ? [] : rowContextMenuBuilders}
      meta={{
        renamingFolder,
        onSubmitRenameFolder,
        closeRenameFolder,
        renamingProject,
        onSubmitRenameProject,
        closeRenameProject,
      }}
      onRename={readonly ? undefined : handleRename}
      onSubmitRename={handleSubmitRename}
      onCancelRename={handleCancelRename}
      onRowDoubleClick={handleRowDoubleClick}
      renamingId={renamingId}
      {...props}
    >
      {renderCell}
    </SimpleTable>
  )
}
