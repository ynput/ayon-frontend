import { useGetProjectFoldersQuery, useListProjectsQuery } from '@shared/api'
import { ExpandedState, RowSelectionState } from '@tanstack/react-table'
import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import useUserProjectPermissions from '@hooks/useUserProjectPermissions'
import buildProjectsTableData, { buildProjectFolderRowId } from './buildProjectsTableData'
import { MENU_ID } from './ProjectsListTableHeader'
import useProjectListUserPreferences from './hooks/useProjectListUserPreferences'
import useProjectsListMenuItems from './hooks/useProjectsListMenuItems'
import { useProjectFolderActions } from './hooks/useProjectFolderActions'
import { useMenuContext } from '@shared/context/MenuContext'
import { useQueryParam } from 'use-query-params'
import { useProjectSelectDispatcher } from '@containers/ProjectMenu/hooks/useProjectSelectDispatcher'
import { useNavigate } from 'react-router-dom'
import { useProjectDefaultTab } from '@hooks/useProjectDefaultTab'
import { useLocalStorage } from '@shared/hooks'
import {
  ProjectFolderFormData,
  ProjectFolderFormDialog,
} from '@pages/ProjectManagerPage/components/ProjectFolderFormDialog'
import { usePowerpack } from '@shared/context'
import ProjectsTable from './ProjectsTable'
import ProjectsShortcuts from './ProjectsShortcuts'

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
  const { powerLicense } = usePowerpack()
  const [expanded, setExpanded] = useState<ExpandedState>({})
  // Show archived state (stored in local storage)
  const [showArchived, setShowArchived] = useLocalStorage<boolean>('projects-show-archived', false)
  // Folder dialog state
  const [folderDialogState, setFolderDialogState] = useState<{
    isOpen: boolean
    folderId?: string
    initial?: Partial<ProjectFolderFormData>
  }>({ isOpen: false })

  const {
    data = [],
    isLoading,
    error,
  } = useListProjectsQuery({ active: showArchived ? undefined : true })
  const { data: folders } = useGetProjectFoldersQuery()

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

  // state
  // search state
  const [clientSearch, setClientSearch] = useQueryParam<undefined | string>('project_search')
  // format data for the table, pass pinned projects for sorting
  // show folders when search is empty, hide when searching

  const showFolders = !clientSearch && powerLicense
  const listsTableData = useMemo(
    () => buildProjectsTableData(projects, showFolders ? folders : [], true, powerLicense),
    [projects, folders, powerLicense, showFolders],
  )
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
    (data?: Partial<ProjectFolderFormData>, folderId?: string) => {
      setFolderDialogState({
        isOpen: true,
        folderId,
        initial: data,
      })
    },
    [],
  )

  const handleCloseFolderDialog = useCallback(() => {
    setFolderDialogState({ isOpen: false })
  }, [])

  // Post-creation callbacks for folder state management
  const handleFolderCreated = useCallback(
    (folderId: string, hadProjects: boolean) => {
      const folderRowId = buildProjectFolderRowId(folderId)
      if (hadProjects) {
        // Projects were added to folder, expand it to show them
        setExpanded((prev) => ({
          ...(typeof prev === 'object' ? prev : {}),
          [folderRowId]: true,
        }))
      } else {
        // Empty folder created, select it for further action
        onSelect([folderRowId])
      }
    },
    [setExpanded, onSelect],
  )

  const handleFoldersCreated = useCallback(
    (parentFolderIds: string[], areExpanding: boolean) => {
      if (areExpanding) {
        // Expand parent folders to show new subfolders
        setExpanded((prev) => {
          const newExpanded = typeof prev === 'object' ? { ...prev } : {}
          parentFolderIds.forEach((id) => {
            newExpanded[buildProjectFolderRowId(id)] = true
          })
          return newExpanded
        })
      }
    },
    [setExpanded],
  )

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
    onDelete: onDeleteProject,
    onOpen: onOpenProject,
    onManage: onOpenProjectManage,
    onShowArchivedToggle,
    onCreateFolder: ({ folderId, projectNames }) =>
      handleOpenFolderDialog({ parentId: folderId, projectNames }),
    onPutProjectsInFolder,
    onPutFolderInFolder,
    onRemoveProjectsFromFolder,
    onDeleteFolder,
    powerLicense,
    onEditFolder,
    onRenameFolder,
  })

  return (
    <>
      <ProjectsTable
        data={listsTableData}
        isLoading={isLoading}
        error={error ? (error as string) : undefined}
        search={clientSearch}
        onSearch={setClientSearch}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        rowPinning={rowPinning}
        onRowPinningChange={onRowPinningChange}
        expanded={expanded}
        setExpanded={setExpanded}
        multiSelect={multiSelect}
        readonly={false}
        buildMenuItems={buildMenuItems}
        selection={selection}
        onSelect={onSelect}
        onOpenProject={onOpenProject}
        title="Projects"
        showAddProject={canCreateProject}
        onNewProject={onNewProject}
        toggleMenu={toggleMenu}
        onSelectAll={toggleSelectAll}
        hiddenButtons={!multiSelect ? ['select-all'] : []}
        renamingFolder={renamingFolder}
        onSubmitRenameFolder={onSubmitRenameFolder}
        closeRenameFolder={closeRenameFolder}
        pt={pt}
      />
      <ProjectFolderFormDialog
        isOpen={folderDialogState.isOpen}
        onClose={handleCloseFolderDialog}
        initial={folderDialogState.initial}
        folderId={folderDialogState.folderId}
        projectNames={selection}
        onPutProjectsInFolder={onPutProjectsInFolder}
        rowSelection={rowSelection}
        folders={folders || []}
        onFolderCreated={handleFolderCreated}
        onFoldersCreated={handleFoldersCreated}
      />
      <ProjectsShortcuts
        rowSelection={rowSelection}
        folders={folders || []}
        onOpenFolderDialog={handleOpenFolderDialog}
        onRenameFolder={onRenameFolder}
        disabled={!powerLicense}
      />
    </>
  )
}

export default ProjectsList
