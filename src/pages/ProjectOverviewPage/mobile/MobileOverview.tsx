import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { Icon } from '@ynput/ayon-react-components'
import { useProjectContext } from '@shared/context'
import {
  useColumnSettingsContext,
  useDetailsPanelEntityContext,
  useSelectionCellsContext,
} from '@shared/containers/ProjectTreeTable'
import type { MatchingFolder } from '@shared/containers/ProjectTreeTable'
import { useAppDispatch } from '@state/store'
import { useProjectOverviewContext } from '../context/project-overview'
import ProjectOverviewDetailsPanel from '../containers/ProjectOverviewDetailsPanel'
import SearchFilterWrapper from '../containers/SearchFilterWrapper'
import { OVERVIEW_FILTER_SCOPES } from '../ProjectOverviewPageHelpers'
import HeaderButton from '@containers/header/HeaderButton'
import {
  useHeaderPageActionsSlot,
  useHeaderPageMainActionSlot,
} from '@containers/MobileShell/MobileShellHelpers'
import MobileTaskRow from './MobileTaskRow'
import MobileFolderSummary from './MobileFolderSummary'
import MobileCardFieldsSheet from './MobileCardFieldsSheet'
import MobileCreateSheet, { type CreateSheetTarget } from './MobileCreateSheet'
import { NewEntity } from '@shared/containers/NewEntity'
import { useLocalStorage } from '@shared/hooks/useLocalStorage'
import * as Styled from './MobileOverview.styled'
import {
  FOLDER_BODY_OFFSET,
  ROOT_LEVEL,
  getChildrenByParent,
  getFolderLabel,
  getFolderTasks,
  getIndent,
  getOpenTaskFolderIds,
  getTaskCountLabel,
} from './MobileOverviewHelpers'
import { getTaskFields, type StatusOption } from './MobileTaskRowHelpers'

const MobileOverview = () => {
  const dispatch = useAppDispatch()
  const project = useProjectContext()
  const { getFolderType, getTaskType, statuses } = project
  const {
    projectName,
    foldersMap,
    tasksMap,
    tasksByFolderMap,
    loadingTasks,
    users,
    attribFields,
    isLoading,
    error,
    softError,
    expanded,
    toggleExpanded,
    setVisibleEntityIds,
    showHierarchy,
    isFlatFolderView,
    projectInfo,
    displayFilters,
    setQueryFilters,
    updateExpanded,
  } = useProjectOverviewContext()
  const hasFilters = !!displayFilters.conditions?.length
  const [isFilterOpen, setIsFilterOpen] = useState(hasFilters)
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false)
  const [createTarget, setCreateTarget] = useState<CreateSheetTarget | null>(null)
  const [hideEmpty, setHideEmpty] = useLocalStorage('mobile-overview-hide-empty', true)
  const headerActionsSlot = useHeaderPageActionsSlot()
  const headerMainActionSlot = useHeaderPageMainActionSlot()
  const { selectedEntity, setSelectedEntity } = useDetailsPanelEntityContext()
  const { setSelectedCells } = useSelectionCellsContext()
  const { columnVisibility, columnOrder, defaultColumnVisibility } = useColumnSettingsContext()

  const childrenByParent = useMemo(() => getChildrenByParent(foldersMap), [foldersMap])
  const expandedMap = typeof expanded === 'object' ? (expanded as Record<string, boolean>) : {}

  const usersByName = useMemo(() => new Map(users.map((user) => [user.name, user])), [users])
  const statusesByName = useMemo(
    () => new Map<string, StatusOption>((statuses ?? []).map((status) => [status.name, status])),
    [statuses],
  )

  // the column settings context hands out new objects on every render
  const visibilityKey = JSON.stringify(columnVisibility)
  const orderKey = columnOrder.join(',')
  const taskFields = useMemo(
    () =>
      getTaskFields({
        columnVisibility,
        columnOrder,
        defaultColumnVisibility,
        attribFields,
        tags: project.tags,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibilityKey, orderKey, defaultColumnVisibility, attribFields, project.tags],
  )
  const folderFields = useMemo(
    () =>
      getTaskFields({
        columnVisibility,
        columnOrder,
        defaultColumnVisibility,
        attribFields,
        scope: 'folder',
        tags: project.tags,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibilityKey, orderKey, defaultColumnVisibility, attribFields, project.tags],
  )

  const openTaskFolderKey = getOpenTaskFolderIds(childrenByParent, expandedMap).join(',')

  // the task loader only fetches expanded folders reported as visible
  useEffect(() => {
    setVisibleEntityIds(openTaskFolderKey ? openTaskFolderKey.split(',') : [])
  }, [openTaskFolderKey, setVisibleEntityIds])

  const openEntity = useCallback(
    (entityId: string, entityType: 'task' | 'folder') => {
      setSelectedCells(new Set())
      setSelectedEntity({ entityId, entityType })
    },
    [setSelectedCells, setSelectedEntity],
  )
  const openTask = useCallback((taskId: string) => openEntity(taskId, 'task'), [openEntity])

  // a new entity shows up only if the folders it was created in are open
  const expandParents = useCallback(
    (_ops: unknown, _stayOpen: boolean, parentFolderIds: string[]) => {
      if (!parentFolderIds.length) return
      updateExpanded((previous) => {
        const current = typeof previous === 'object' ? previous : {}
        return { ...current, ...Object.fromEntries(parentFolderIds.map((id) => [id, true])) }
      })
    },
    [updateExpanded],
  )
  const openFolder = useCallback((folderId: string) => openEntity(folderId, 'folder'), [openEntity])

  const renderFolder = (folder: MatchingFolder, depth: number) => {
    const isOpen = !!expandedMap[folder.id]
    const folderStatus = statusesByName.get(folder.status)
    const tasks = isOpen ? getFolderTasks(folder.id, tasksByFolderMap, tasksMap) : []
    const count = tasks.length
      ? getTaskCountLabel(tasks.length)
      : isOpen && folder.id in loadingTasks
      ? 'Loading…'
      : undefined

    return (
      <section key={folder.id}>
        <Styled.FolderRow $depth={depth} $isOpen={isOpen}>
          <Styled.FolderToggle
            type="button"
            $depth={depth}
            aria-expanded={isOpen}
            onClick={() => toggleExpanded(folder.id)}
          >
            <Icon icon={isOpen ? 'expand_more' : 'chevron_right'} className="caret" />
            <Icon icon={getFolderType(folder.folderType)?.icon || 'folder'} />
            <span className="name">{getFolderLabel(folder)}</span>
            {count && <span className="count">{count}</span>}
            <Styled.StatusPill
              variant="filled"
              label={folderStatus?.name ?? folder.status}
              icon={folderStatus?.icon}
              color={folderStatus?.color}
              colorLight={folderStatus?.colorLight}
            />
          </Styled.FolderToggle>
          <Styled.FolderDetailsButton
            type="button"
            aria-label={`Actions for ${getFolderLabel(folder)}`}
            onClick={() =>
              setCreateTarget({ folderId: folder.id, folderLabel: getFolderLabel(folder) })
            }
          >
            <Icon icon="more_horiz" />
          </Styled.FolderDetailsButton>
        </Styled.FolderRow>
        {isOpen && (
          <>
            <MobileFolderSummary
              folder={folder}
              projectName={projectName}
              folderType={getFolderType(folder.folderType)}
              usersByName={usersByName}
              fields={folderFields}
              hideEmpty={hideEmpty}
              indent={getIndent(depth) + FOLDER_BODY_OFFSET}
              onOpen={openFolder}
            />
            {(childrenByParent.get(folder.id) ?? []).map((child) => renderFolder(child, depth + 1))}
            {tasks.map((task) => (
              <MobileTaskRow
                key={task.id}
                task={task}
                projectName={projectName}
                taskType={getTaskType(task.taskType)}
                status={statusesByName.get(task.status)}
                usersByName={usersByName}
                fields={taskFields}
                hideEmpty={hideEmpty}
                indent={getIndent(depth)}
                onOpen={openTask}
              />
            ))}
          </>
        )}
      </section>
    )
  }

  const renderList = () => {
    if (error) return <Styled.Message>{error}</Styled.Message>
    if (!showHierarchy && !isFlatFolderView) {
      return (
        <Styled.Message>
          This view is grouped. The mobile list shows the hierarchy only.
        </Styled.Message>
      )
    }
    if (isLoading && !foldersMap.size) return <Styled.Message>Loading…</Styled.Message>

    const rootFolders = childrenByParent.get(ROOT_LEVEL) ?? []
    if (!rootFolders.length) return <Styled.Message>No folders</Styled.Message>

    return (
      <>
        {softError && <Styled.Message>{softError}</Styled.Message>}
        {rootFolders.map((folder) => renderFolder(folder, 0))}
      </>
    )
  }

  return (
    <Styled.Page>
      {headerActionsSlot &&
        createPortal(
          <HeaderButton
            icon="search"
            variant="nav"
            aria-label="Search and filter"
            aria-pressed={isFilterOpen}
            className={clsx({ active: isFilterOpen || hasFilters })}
            onClick={() => setIsFilterOpen((open) => !open)}
          />,
          headerActionsSlot,
        )}
      {headerActionsSlot &&
        createPortal(
          <HeaderButton
            icon="settings"
            variant="nav"
            aria-label="View options"
            className={clsx({ active: isCustomizeOpen })}
            onClick={() => setIsCustomizeOpen(true)}
          />,
          headerActionsSlot,
        )}
      {headerMainActionSlot &&
        createPortal(
          <Styled.CreateHeaderButton
            icon="add"
            variant="nav"
            aria-label="Create"
            className={clsx({ active: !!createTarget && !createTarget.folderId })}
            onClick={() => setCreateTarget({})}
          />,
          headerMainActionSlot,
        )}
      <MobileCreateSheet
        target={createTarget}
        onHide={() => setCreateTarget(null)}
        onOpenDetails={openFolder}
      />
      <NewEntity showButton={false} enableShortcuts={false} onNewEntities={expandParents} />
      <MobileCardFieldsSheet
        visible={isCustomizeOpen}
        onHide={() => setIsCustomizeOpen(false)}
        attribFields={attribFields}
        hideEmpty={hideEmpty}
        onHideEmptyChange={setHideEmpty}
      />
      {isFilterOpen && (
        <Styled.FilterBar>
          <SearchFilterWrapper
            queryFilters={displayFilters}
            onChange={setQueryFilters}
            scopes={OVERVIEW_FILTER_SCOPES}
            projectNames={projectName ? [projectName] : []}
            // @ts-expect-error: projectInfo is never matching, whatever
            projectInfo={projectInfo}
            tasksMap={tasksMap}
            data={{}}
          />
        </Styled.FilterBar>
      )}
      <Styled.List>{renderList()}</Styled.List>

      {selectedEntity && (
        <Styled.DetailsOverlay>
          <Styled.DetailsBar>
            <Styled.BackButton type="button" onClick={() => setSelectedEntity(null)}>
              <Icon icon="chevron_left" />
              <span>Back</span>
            </Styled.BackButton>
          </Styled.DetailsBar>
          <Styled.DetailsBody>
            <ProjectOverviewDetailsPanel
              projectInfo={project}
              projectName={projectName}
              dispatch={dispatch}
            />
          </Styled.DetailsBody>
        </Styled.DetailsOverlay>
      )}
    </Styled.Page>
  )
}

export default MobileOverview
