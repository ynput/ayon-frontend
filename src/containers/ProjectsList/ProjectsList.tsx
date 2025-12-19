import {
  useGetProjectFoldersQuery,
  useListProjectsQuery,
} from '@shared/api'
import SimpleTable, { Container, SimpleTableProvider } from '@shared/containers/SimpleTable'
import { RowSelectionState, ExpandedState } from '@tanstack/react-table'
import { FC, useCallback, useEffect, useMemo } from 'react'
import useUserProjectPermissions from '@hooks/useUserProjectPermissions'
import buildProjectsTableData from './buildProjectsTableData'
import ProjectsListTableHeader, { MENU_ID } from './ProjectsListTableHeader'
import ProjectsListRow from './ProjectsListRow'
import useProjectListUserPreferences from './hooks/useProjectListUserPreferences'
import useProjectsListMenuItems from './hooks/useProjectsListMenuItems'
import { useProjectFolderActions } from './hooks/useProjectFolderActions'
import { useMenuContext } from '@shared/context/MenuContext'
import { useQueryParam } from 'use-query-params'
import { useProjectSelectDispatcher } from '@containers/ProjectMenu/hooks/useProjectSelectDispatcher'
import { useNavigate } from 'react-router-dom'
import { useCreateContextMenu } from '@shared/containers'
import { useProjectDefaultTab } from '@hooks/useProjectDefaultTab'
import { useLocalStorage } from '@shared/hooks'
import { ProjectFolderFormDialog } from '@pages/ProjectManagerPage/components/ProjectFolderFormDialog'
import { FolderFormData } from '@pages/ProjectManagerPage/components/ProjectFolderFormDialog/ProjectFolderFormDialog'
import { useState } from 'react'
import { usePowerpack } from '@shared/context'
export const PROJECTS_LIST_WIDTH_KEY = 'projects-list-splitter'

interface ProjectsListProps {
  selection: string[]
  onSelect: (ids: string[]) => void
  multiSelect?: boolean
  onNewProject?: () => void
  onActivateProject?: (projectName: string, active: boolean) => void
  onDeleteProject?: (projectName: string) => void
  onNoProjectSelected?: (projectName: string) => void
  pt?: {
    container?: React.HTMLAttributes<HTMLDivElement>
  }
}

const ProjectsList: FC<ProjectsListProps> = ({
  selection,
  onSelect,
  multiSelect,
  onNewProject,
  onActivateProject,
  onDeleteProject,
  onNoProjectSelected,
  pt,
}) => {
  // GET USER PREFERENCES (moved to hook)
  const { rowPinning = [], onRowPinningChange, user } = useProjectListUserPreferences()
  const {powerLicense} = usePowerpack()
  const [expanded, setExpanded] = useState<ExpandedState>({})
  // Show archived state (stored in local storage)
  const [showArchived, setShowArchived] = useLocalStorage<boolean>('projects-show-archived', false)

  // Folder dialog state
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [folderDialogData, setFolderDialogData] = useState<Partial<FolderFormData> | undefined>(
    undefined,
  )
  const [folderDialogId, setFolderDialogId] = useState<string | undefined>(undefined)

  const {
    data = [],
    isLoading,
    error,
  } = useListProjectsQuery({ active: showArchived ? undefined : true })
  const {
    data: folders,
  } = useGetProjectFoldersQuery()


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

  useEffect(() => {
    if (selection?.length) return
    if (!projects?.length) return
    if (!onNoProjectSelected) return
    onNoProjectSelected(projects[0].name)
  }, [selection, projects, onNoProjectSelected])

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
  }, [multiSelect, selection, selectedProjects, onSelect, projects])

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
    () => buildProjectsTableData(projects, folders, true, powerLicense),
    [projects, folders, powerLicense],
  )

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
  const { toggleMenuOpen } = useMenuContext()
  const toggleMenu = (open: boolean = true) => {
    toggleMenuOpen(open ? MENU_ID : false)
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

  const [handleProjectSelectionDispatches] = useProjectSelectDispatcher()
  const { getDefaultTab } = useProjectDefaultTab()

  const navigate = useNavigate()
  const onOpenProject = (project: string) => {
    if ((user?.uiExposureLevel || 0) < 500) return

    handleProjectSelectionDispatches(project)

    const defaultTab = getDefaultTab()
    const link = `/projects/${project}/${defaultTab}`
    navigate(link)
  }

  const onOpenProjectManage = (project: string) => {
    const link = `/manageProjects/anatomy?project=${project}`
    navigate(link)
  }
  const onArchive = (projectName: string, active: boolean) => {
    onActivateProject?.(projectName, active)

    if (!active && !showArchived) {
      const newSelection = selection.filter((p) => p !== projectName)
      if (newSelection.length === 0 && projects.length > 0) {
        const firstAvailable = projects.find((p) => p.name !== projectName)
        if (firstAvailable) {
          onSelect([firstAvailable.name])
        } else {
          onSelect([])
        }
      } else {
        onSelect(newSelection)
      }
    }
  }
  const onShowArchivedToggle = () => {
    if (showArchived) {
      const activeProjects = projects.filter((p) => p.active)
      onSelect(selection.filter((s) => activeProjects.some((p) => p.name === s)))
    }
    setShowArchived(!showArchived)
  }

  // Folder dialog handlers
  const handleOpenFolderDialog = useCallback(
    (data?: Partial<FolderFormData>, folderId?:string) => {
      setFolderDialogData(data)
      setFolderDialogId(folderId)
      setFolderDialogOpen(true)
    },
    [],
  )

  const handleCloseFolderDialog = useCallback(() => {
    setFolderDialogOpen(false)
    setFolderDialogData(undefined)
    setFolderDialogId(undefined)
  }, [])

  // Use project folder actions hook
  const {
    onPutProjectsInFolder,
    onPutFolderInFolder,
    onRemoveProjectsFromFolder,
    onDeleteFolder,
    onEditFolder,
    onRenameFolder,
    renamingFolder,
    onSubmitRenameFolder,
    closeRenameFolder,
  } = useProjectFolderActions({
    folders,
    onSelect,
    handleOpenFolderDialog,
  })

  // Generate menu items used in both header and context menu
  const buildMenuItems = useProjectsListMenuItems({
    hidden: {
      'add-project': !canCreateProject,
      'delete-project': !user?.data?.isAdmin && !user?.data?.isManager,
      'archive-project': !user?.data?.isAdmin && !user?.data?.isManager,
    },
    projects: projects,
    folders: folders || [],
    multiSelect,
    pinned: rowPinning,
    showArchived,
    userLevel: user?.uiExposureLevel,
    onNewProject,
    onSearch: () => setClientSearch(''),
    onPin: (pinned) => onRowPinningChange({ top: pinned }),
    onSelectAll: toggleSelectAll,
    onArchive,
    onDelete:  onDeleteProject ,
    onOpen: onOpenProject,
    onManage: onOpenProjectManage,
    onShowArchivedToggle,
    onCreateFolder: ({folderId, projectNames}) => handleOpenFolderDialog({parentId: folderId, projectNames}),
    onPutProjectsInFolder,
    onPutFolderInFolder,
    onRemoveProjectsFromFolder,
    onDeleteFolder,
    powerLicense,
    onEditFolder,
    onRenameFolder,
  })

  // attach context menu
  // create the ref and model
  const [ctxMenuShow] = useCreateContextMenu()

  const handleRowContext = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault()
      e.stopPropagation()

      let newSelection: string[] = [...selection]
      // if we are selecting a row outside of the selection (or none), set the selection to the row
      if (!newSelection.includes(e.currentTarget.id)) {
        newSelection = [e.currentTarget.id]
        onSelect(newSelection)
      }
      const newSelectedRows = newSelection

      // build menu items based on selection
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
    },
    [ctxMenuShow, buildMenuItems, selection, onSelect],
  )

  return (
    <>
      <SimpleTableProvider
        {...{
          rowSelection,
          onRowSelectionChange: setRowSelection,
          rowPinning: { top: rowPinning },
          onRowPinningChange,
          expanded,
          setExpanded
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
            menuItems={buildMenuItems(selection)}
            toggleMenu={toggleMenu}
            onSelectAll={toggleSelectAll}
            hiddenButtons={!multiSelect ? ['select-all'] : []}
          />
          <SimpleTable
            data={listsTableData}
            globalFilter={clientSearch ?? undefined}
            isExpandable={true}
            isLoading={isLoading}
            isMultiSelect={multiSelect}
            error={error ? (error as string) : undefined}
            enableClickToDeselect={false}
            enableNonFolderIndent={true}
            meta={{
              handleRowContext,
              renamingFolder,
              onSubmitRenameFolder,
              closeRenameFolder,
            }}
          >
            {(props, row, table) => (
              <ProjectsListRow
                {...props}
                id={row.id}
                onContextMenu={table.options.meta?.handleRowContext}
                code={row.original.data.code}
                isPinned={row.getIsPinned() === 'top'}
                onPinToggle={() => row.pin(row.getIsPinned() === 'top' ? false : 'top')}
                inactive={row.original.data.active === false}
                onDoubleClick={() =>  row.original.data?.isFolder
                  ? undefined
                  : () => onOpenProject(row.original.name)  }
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
      <ProjectFolderFormDialog
        isOpen={folderDialogOpen}
        onClose={handleCloseFolderDialog}
        initial={folderDialogData}
        folderId={folderDialogId}
        projectNames={selection}
        onPutProjectsInFolder={onPutProjectsInFolder}
      />
    </>
  )
}

export default ProjectsList
