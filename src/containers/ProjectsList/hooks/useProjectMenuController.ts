import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RowSelectionState } from '@tanstack/react-table'
import { toast } from 'react-toastify'
import {
  ListProjectsItemModel,
  ProjectFolderModel,
  useDeleteProjectMutation,
  useUpdateProjectMutation,
} from '@shared/api'
import { usePowerpack } from '@shared/context'
import type { ListTableRowContextMenuContext } from '@shared/containers/ListTable'
import { useProjectSelectDispatcher } from '@containers/ProjectMenu/hooks/useProjectSelectDispatcher'
import { useProjectDefaultTab } from '@hooks/useProjectDefaultTab'
import useUserProjectPermissions from '@hooks/useUserProjectPermissions'
import { buildProjectFolderRowId } from '../buildProjectsTableData'
import type { ProjectFolderFormData } from '@pages/ProjectManagerPage/components/ProjectFolderFormDialog'
import useProjectListUserPreferences from './useProjectListUserPreferences'
import useProjectListMenuItems, { type Hidden } from './useProjectsListMenuItems'
import { useProjectFolderActions } from './useProjectFolderActions'
import { confirmDelete, getProjectDisplayName } from '@shared/util'

type ProjectFolderDialogProps = {
  isOpen: boolean
  onClose: () => void
  initial?: Partial<ProjectFolderFormData>
  folderId?: string
  projectNames: string[]
  onPutProjectsInFolder: (projectNames: string[], folderId: string) => void
  rowSelection: RowSelectionState
  folders: ProjectFolderModel[]
  onFolderCreated?: (folderId: string, hadProjects: boolean) => void
  onFoldersCreated?: (parentFolderIds: string[], areExpanding: boolean) => void
}

type BuildListTableContextMenuItemsContext = Pick<
  ListTableRowContextMenuContext<any>,
  'selectedRows' | 'isGroupRow' | 'groupColumnId' | 'groupValue'
>

interface UseProjectMenuControllerProps {
  projects: ListProjectsItemModel[]
  folders?: ProjectFolderModel[]
  selection: string[]
  onSelect: (ids: string[]) => void
  onNewProject?: () => void
  multiSelect?: boolean
  showArchived?: boolean
  onSelectAll?: () => void
  onShowArchivedToggle?: () => void
  hidden?: Hidden
  onFolderCreated?: (folderId: string, hadProjects: boolean) => void
  onFoldersCreated?: (parentFolderIds: string[], areExpanding: boolean) => void
  folderGroupColumnId?: string
}

const CONTEXT_MENU_HIDDEN: Hidden = {
  search: true,
  'add-project': true,
  'select-all': true,
}

export const useProjectMenuController = ({
  projects,
  folders = [],
  selection,
  onSelect,
  onNewProject,
  multiSelect,
  showArchived = false,
  onSelectAll,
  onShowArchivedToggle,
  hidden = {},
  onFolderCreated,
  onFoldersCreated,
  folderGroupColumnId = 'projectFolder',
}: UseProjectMenuControllerProps) => {
  const { rowPinning = [], onRowPinningChange, user } = useProjectListUserPreferences()
  const { powerLicense } = usePowerpack()
  const { isLoading: userPermissionsLoading, permissions: userPermissions } =
    useUserProjectPermissions(user?.data?.isUser || true)
  const canCreateProject =
    (!userPermissionsLoading && userPermissions?.canCreateProject()) ||
    user?.data?.isAdmin ||
    user?.data?.isManager
  const canEditProjectLabel = !!(user?.data?.isAdmin || user?.data?.isManager)
  const [updateProject] = useUpdateProjectMutation()
  const [deleteProject] = useDeleteProjectMutation()
  const [folderDialogState, setFolderDialogState] = useState<{
    isOpen: boolean
    folderId?: string
    initial?: Partial<ProjectFolderFormData>
  }>({ isOpen: false })
  const navigate = useNavigate()
  const { getDefaultTab } = useProjectDefaultTab()
  const [handleProjectSelectionDispatches] = useProjectSelectDispatcher()

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
    onRenameProject,
    renamingProject,
    onSubmitRenameProject,
    closeRenameProject,
  } = useProjectFolderActions({
    folders,
    onSelect,
    handleOpenFolderDialog,
  })

  const onOpenProject = useCallback(
    (project: string) => {
      if ((user?.uiExposureLevel || 0) < 500) return

      handleProjectSelectionDispatches(project)

      const defaultTab = getDefaultTab()
      navigate(`/projects/${project}/${defaultTab}`)
    },
    [getDefaultTab, handleProjectSelectionDispatches, navigate, user?.uiExposureLevel],
  )

  const onOpenProjectManage = useCallback(
    (project: string) => {
      navigate(`/manageProjects/anatomy?project=${project}`)
    },
    [navigate],
  )

  const handleArchive = useCallback(
    async (projectName: string, active: boolean) => {
      try {
        await updateProject({ projectName, projectPatchModel: { active } }).unwrap()
      } catch (error: any) {
        toast.error(error?.data?.detail || 'Failed to update project state')
      }
    },
    [updateProject, showArchived, selection, projects, onSelect],
  )

  const handleDelete = useCallback(
    (projectName: string) => {
      const project = projects.find((p) => p.name === projectName)
      const displayName = project ? getProjectDisplayName(project) : projectName
      const confirmLabel =
        displayName && displayName !== projectName
          ? `Project: ${displayName} (${projectName})`
          : `Project: ${projectName}`

      confirmDelete({
        label: confirmLabel,
        accept: async () => {
          await deleteProject({ projectName }).unwrap()
          onSelect(selection.filter((selectedId) => selectedId !== projectName))
        },
      })
    },
    [deleteProject, onSelect, projects, selection],
  )

  const buildMenuItems = useProjectListMenuItems({
    hidden: {
      'add-project': !canCreateProject,
      'delete-project': !canEditProjectLabel,
      'archive-project': !canEditProjectLabel,
      'edit-label': !canEditProjectLabel,
      ...hidden,
    },
    projects,
    folders,
    multiSelect,
    pinned: rowPinning,
    showArchived,
    userLevel: user?.uiExposureLevel,
    onNewProject,
    onPin: (pinned) => onRowPinningChange({ top: pinned }),
    onSelectAll,
    onArchive: handleArchive,
    onDelete: handleDelete,
    onOpen: onOpenProject,
    onManage: onOpenProjectManage,
    onShowArchivedToggle,
    powerLicense,
    onCreateFolder: ({ folderId, projectNames }) =>
      handleOpenFolderDialog({ parentId: folderId, projectNames }),
    onPutProjectsInFolder,
    onPutFolderInFolder,
    onRemoveProjectsFromFolder,
    onDeleteFolder,
    onEditFolder,
    onRenameFolder,
    onRenameProject: canEditProjectLabel ? onRenameProject : undefined,
  })

  const buildContextMenuItems = useCallback(
    (contextSelection: string[], hiddenOverrides: Hidden = {}) =>
      buildMenuItems(contextSelection, {
        command: true,
        dividers: false,
        hidden: {
          ...CONTEXT_MENU_HIDDEN,
          ...hiddenOverrides,
        },
      }),
    [buildMenuItems],
  )

  const buildListTableContextMenuItems = useCallback(
    (context: BuildListTableContextMenuItemsContext) => {
      if (context.isGroupRow) {
        if (context.groupColumnId !== folderGroupColumnId) {
          return undefined
        }

        const folderId =
          typeof context.groupValue === 'object' &&
          context.groupValue !== null &&
          'value' in context.groupValue
            ? context.groupValue.value
            : context.groupValue

        if (!folderId) {
          return undefined
        }

        return buildContextMenuItems([buildProjectFolderRowId(String(folderId))])
      }

      return buildContextMenuItems(context.selectedRows)
    },
    [buildContextMenuItems, folderGroupColumnId],
  )

  const rowSelection = useMemo(
    () =>
      selection.reduce((acc, id) => {
        acc[id] = true
        return acc
      }, {} as RowSelectionState),
    [selection],
  )

  const folderDialogProps: ProjectFolderDialogProps = {
    isOpen: folderDialogState.isOpen,
    onClose: handleCloseFolderDialog,
    initial: folderDialogState.initial,
    folderId: folderDialogState.folderId,
    projectNames: selection,
    onPutProjectsInFolder,
    rowSelection,
    folders,
    onFolderCreated,
    onFoldersCreated,
  }

  return {
    buildMenuItems,
    buildContextMenuItems,
    buildListTableContextMenuItems,
    canCreateProject,
    canEditProjectLabel,
    rowPinning,
    onRowPinningChange,
    user,
    onOpenProject,
    handleOpenFolderDialog,
    folderDialogProps,
    renamingFolder,
    onSubmitRenameFolder,
    closeRenameFolder,
    renamingProject,
    onSubmitRenameProject,
    closeRenameProject,
    onRenameFolder,
    onRenameProject: canEditProjectLabel ? onRenameProject : undefined,
    powerLicense,
  }
}

export default useProjectMenuController
