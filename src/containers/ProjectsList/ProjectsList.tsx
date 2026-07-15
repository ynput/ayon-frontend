import { useGetProjectFoldersQuery } from '@shared/api'
import { getProjectDisplayName } from '@shared/util'
import { ExpandedState, RowSelectionState } from '@tanstack/react-table'
import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import buildProjectsTableData, { buildProjectFolderRowId } from './buildProjectsTableData'
import { MENU_ID } from './ProjectsListTableHeader'
import useProjectMenuController from './hooks/useProjectMenuController'
import { useMenuContext } from '@shared/context/MenuContext'
import { useQueryParam } from 'use-query-params'
import { useLocalStorage } from '@shared/hooks'
import { ProjectFolderFormDialog } from '@pages/ProjectManagerPage/components/ProjectFolderFormDialog'
import { useGlobalContext, usePowerpack } from '@shared/context'
import ProjectsTable from './ProjectsTable'
import ProjectsShortcuts from './ProjectsShortcuts'

export const PROJECTS_LIST_WIDTH_KEY = 'projects-list-splitter'

interface ProjectsListProps {
  selection: string[]
  onSelect: (ids: string[]) => void
  multiSelect?: boolean
  onNewProject?: () => void
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
  onNoProjectSelected,
  pt,
}) => {
  // GET USER PREFERENCES (moved to hook)
  const { powerLicense } = usePowerpack()
  const {
    projects: globalProjects,
    isLoading: globalIsLoading,
    error: globalError,
  } = useGlobalContext()
  const [expanded, setExpanded] = useState<ExpandedState>({})
  // Show archived state (stored in local storage)
  const [showArchived, setShowArchived] = useLocalStorage<boolean>('projects-show-archived', false)

  const data = showArchived ? globalProjects.all : globalProjects.active
  const isLoading = globalIsLoading.projects
  const error = globalError.projects
  const { data: folders } = useGetProjectFoldersQuery()

  // transformations
  // sort projects by active pinned, active, inactive (active=false) and then alphabetically by display name (label || name)
  const projects = useMemo(() => {
    return [...data].sort((a, b) => {
      if (a.active && !b.active) return -1
      if (!a.active && b.active) return 1
      return getProjectDisplayName(a).localeCompare(getProjectDisplayName(b))
    })
  }, [data])

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
  const onShowArchivedToggle = () => {
    if (showArchived) {
      const activeProjects = projects.filter((p) => p.active)
      onSelect(selection.filter((s) => activeProjects.some((p) => p.name === s)))
    }
    setShowArchived(!showArchived)
  }

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
  const {
    buildMenuItems,
    rowContextMenuBuilder,
    canCreateProject,
    rowPinning,
    onRowPinningChange,
    onOpenProject,
    handleOpenFolderDialog,
    folderDialogProps,
    onRenameFolder,
    onRenameProject,
    renamingFolder,
    onSubmitRenameFolder,
    closeRenameFolder,
    renamingProject,
    onSubmitRenameProject,
    closeRenameProject,
  } = useProjectMenuController({
    projects,
    folders: folders || [],
    selection,
    onSelect,
    onNewProject,
    multiSelect,
    showArchived,
    onSelectAll: toggleSelectAll,
    onShowArchivedToggle,
    onFolderCreated: handleFolderCreated,
    onFoldersCreated: handleFoldersCreated,
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
        rowContextMenuBuilders={[rowContextMenuBuilder]}
        selection={selection}
        onSelect={onSelect}
        onOpenProject={onOpenProject}
        title="Projects"
        showAddProject={canCreateProject}
        onNewProject={onNewProject}
        toggleMenu={toggleMenu}
        onSelectAll={toggleSelectAll}
        hiddenButtons={!multiSelect ? ['select-all'] : []}
        onRenameFolder={onRenameFolder}
        onRenameProject={onRenameProject}
        renamingFolder={renamingFolder}
        onSubmitRenameFolder={onSubmitRenameFolder}
        closeRenameFolder={closeRenameFolder}
        renamingProject={renamingProject}
        onSubmitRenameProject={onSubmitRenameProject}
        closeRenameProject={closeRenameProject}
        pt={pt}
      />
      <ProjectFolderFormDialog {...folderDialogProps} />
      <ProjectsShortcuts onOpenFolderDialog={handleOpenFolderDialog} disabled={!powerLicense} />
    </>
  )
}

export default ProjectsList
