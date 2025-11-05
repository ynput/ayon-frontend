import { useDispatch, useSelector } from 'react-redux'
import {
  useGetKanbanProjectUsersQuery,
  useGetKanbanQuery,
  useGetAttributeConfigQuery,
} from '@shared/api'
import { DetailsPanel, DetailsPanelSlideOut } from '@shared/containers'
import { filterProjectStatuses } from '@shared/hooks'
import { getPriorityOptions } from '@shared/util'
import { useScopedDetailsPanel } from '@shared/context'
import { EmptyPlaceholder } from '@shared/components'

import UserDashboardKanBan from './UserDashboardKanBan'
import { useEffect, useMemo } from 'react'
import { onAssigneesChanged } from '@state/dashboard'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { getIntersectionFields, getMergedFields } from '../util'
import transformKanbanTasks from './transformKanbanTasks'
import styled from 'styled-components'
import clsx from 'clsx'
import { openViewer } from '@state/viewer'
import RelatedTasksModule from './RelatedTasks'
import DetailsPanelSplitter from '@components/DetailsPanelSplitter'

const StyledSplitter = styled(Splitter)`
  .details-panel-splitter {
    /* This is a crazy hack to prevent the cursor being out of line with the dragging card */
    &.dragging {
      transition: max-width 0s, min-width 0s;
      transition-delay: 0.1s;
    }
  }
`

export const getThumbnailUrl = ({ entityId, entityType, thumbnailId, updatedAt, projectName }) => {
  // If projectName is not provided or neither thumbnailId nor entityId and entityType are provided, return null
  if (!projectName || (!thumbnailId && (!entityId || !entityType))) return null

  // Construct the updatedAt query parameter if updatedAt is provided
  const updatedAtQueryParam = updatedAt ? `?updatedAt=${updatedAt}` : ''

  // If entityId and entityType are provided, construct the URL using them
  if (entityId && entityType) {
    const entityUrl = `/api/projects/${projectName}/${entityType}s/${entityId}/thumbnail`
    return `${entityUrl}${updatedAtQueryParam}`
  }

  // If entityId and entityType are not provided, fallback on thumbnailId
  const thumbnailUrl = `/api/projects/${projectName}/thumbnails/${thumbnailId}`
  return `${thumbnailUrl}${updatedAtQueryParam}`
}

const UserTasksContainer = ({ projectsInfo = {}, isLoadingInfo }) => {
  const dispatch = useDispatch()
  const selectedProjects = useSelector((state) => state.dashboard.selectedProjects)
  let { isOpen: isPanelOpen } = useScopedDetailsPanel('dashboard')

  const user = useSelector((state) => state.user)
  const assigneesState = useSelector((state) => state.dashboard.tasks.assignees)
  const assigneesFilter = useSelector((state) => state.dashboard.tasks.assigneesFilter)
  const draggingIds = useSelector((state) => state.dashboard.tasks.draggingIds)
  const isDragging = draggingIds.length > 0
  // Only admins and managers can see task of other users

  const handleOpenViewer = (args) => dispatch(openViewer(args))

  let assignees = []
  switch (assigneesFilter) {
    case 'me':
      assignees = [user.name]
      break
    case 'all':
      assignees = []
      break
    case 'users':
      assignees = assigneesState
      break
    default:
      break
  }

  const selectedTasks = useSelector((state) => state.dashboard.tasks.selected) || []
  const taskTypes = useSelector((state) => state.dashboard.tasks.types) || []

  // once user is loaded, set assignees to user
  useEffect(() => {
    if (!assigneesState) {
      dispatch(onAssigneesChanged([user.name]))
    }
  }, [user.name])

  const taskFields = {
    status: { plural: 'statuses', isEditable: true },
    taskType: { plural: 'taskTypes', isEditable: true },
    folderType: { plural: 'folderTypes', isEditable: false },
  }

  //  get kanban tasks for all projects by assigned user (me)
  let {
    data: tasks = [],
    isFetching: isLoadingTasks,
    isError,
    error,
  } = useGetKanbanQuery(
    { assignees: assignees, projects: selectedProjects },
    { skip: !assignees.length || !selectedProjects?.length },
  )

  // get priority attribute so we know the colors and icons for each priority
  const { data: priorityAttrib } = useGetAttributeConfigQuery({ attributeName: 'priority' })
  const priorities = getPriorityOptions(priorityAttrib, 'task') || []

  // add extra fields to tasks like: icons, thumbnailUrl, shortPath
  const transformedTasks = useMemo(
    () => transformKanbanTasks(tasks, { projectsInfo, isLoadingTasks, priorities }),
    [tasks, projectsInfo, priorities, isLoadingTasks],
  )

  const selectedTasksData = useMemo(
    () => transformedTasks.filter((task) => selectedTasks.includes(task.id)),
    [selectedTasks, transformedTasks],
  )

  isPanelOpen = selectedTasksData.length && isPanelOpen

  // for selected tasks, get flat list of projects
  const selectedTasksProjects = useMemo(
    () => [...new Set(selectedTasksData.map((t) => t.projectName))],
    [selectedTasks, selectedTasksData],
  )

  // we need to get the intersection of all the statuses of the projects for the selected tasks
  // this means that if we have 2 tasks from 2 different projects, we need to get the intersection of the statuses of those 2 projects
  //  and it prevents us from showing statuses that are not available for the selected tasks
  const statusesOptions = useMemo(
    () => getMergedFields(projectsInfo, 'statuses'),
    [projectsInfo, isLoadingInfo],
  )

  const scopedStatusesOptions = useMemo(
    () => filterProjectStatuses(statusesOptions, ['task']),
    [statusesOptions, isLoadingInfo],
  )

  const statusesIntersection = useMemo(
    () => getIntersectionFields(projectsInfo, 'statuses', selectedTasksProjects),
    [projectsInfo, selectedTasksProjects],
  )

  const disabledStatuses = useMemo(
    () =>
      scopedStatusesOptions
        .filter((s) => !statusesIntersection.some((s2) => s2.name === s.name))
        .map((s) => s.name),
    [projectsInfo, selectedTasksProjects, scopedStatusesOptions],
  )

  // find the intersection of all the tags of the projects for the selected tasks
  const tagsOptions = useMemo(
    () => getIntersectionFields(projectsInfo, 'tags', selectedTasksProjects),
    [projectsInfo, selectedTasksProjects],
  )

  const { data: projectUsers = [], isLoading: isLoadingProjectUsers } =
    useGetKanbanProjectUsersQuery(
      { projects: selectedProjects },
      { skip: !selectedProjects?.length },
    )

  // for selected projects, make sure user is on all
  const [activeProjectUsers, disabledProjectUsers] = useMemo(() => {
    if (!selectedTasksProjects?.length) return [projectUsers, []]
    return projectUsers.reduce(
      (acc, user) => {
        if (selectedTasksProjects.every((p) => user.projects?.includes(p))) {
          acc[0].push(user)
        } else {
          acc[1].push(user)
        }
        return acc
      },
      [[], []],
    )
  }, [selectedTasksProjects, projectUsers])

  const { setOpen } = useScopedDetailsPanel('dashboard')

  const handlePanelClose = () => {
    setOpen(false)
  }

  const isLoadingAll = isLoadingInfo || isLoadingTasks
  let detailsMinWidth = 533
  let detailsMaxWidth = '40vw'
  let detailsMaxMaxWidth = 700

  if (isError) return <EmptyPlaceholder error={error} />

  return (
    <DetailsPanelSplitter
      layout="horizontal"
      style={{
        height: '100%',
        zIndex: 10,
        overflow: 'hidden',
        width: '100%',
        gap: 0,
        marginLeft: -8,
      }}
      stateKey="user-dashboard-tasks"
      className="dashboard-tasks"
      gutterSize={6}
    >
      <SplitterPanel
        style={{
          height: '100%',
          zIndex: 10,
          padding: 0,
          overflow: 'hidden',
          marginRight: -6,

          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
        size={4}
      >
        <UserDashboardKanBan
          tasks={transformedTasks}
          isLoading={isLoadingAll}
          projectsInfo={projectsInfo}
          taskFields={taskFields}
          statusesOptions={scopedStatusesOptions}
          disabledStatuses={disabledStatuses}
          disabledProjectUsers={disabledProjectUsers}
          priorities={priorities}
          projectUsers={projectUsers}
          isLoadingProjectUsers={isLoadingProjectUsers}
        />
        <RelatedTasksModule
          isPanelOpen={isPanelOpen}
          projectsInfo={projectsInfo}
          priorities={priorities}
          onOpenViewer={handleOpenViewer}
        />
      </SplitterPanel>

      <SplitterPanel
        size={1}
        className={clsx('details-panel-splitter', 'details', { dragging: isDragging })}
        style={{
          maxWidth: isDragging
            ? 0
            : `clamp(${detailsMinWidth}px, ${detailsMaxWidth}, ${detailsMaxMaxWidth}px)`,
          minWidth: isDragging ? 0 : detailsMinWidth,
        }}
      >
        <DetailsPanel
          isOpen={isPanelOpen}
          onClose={handlePanelClose}
          entitiesData={selectedTasksData}
          disabledStatuses={disabledStatuses}
          tagsOptions={tagsOptions}
          projectUsers={projectUsers}
          activeProjectUsers={activeProjectUsers}
          disabledProjectUsers={disabledProjectUsers}
          selectedTasksProjects={selectedTasksProjects}
          projectsInfo={projectsInfo}
          projectNames={selectedTasksProjects}
          entityType="task"
          entitySubTypes={taskTypes}
          scope="dashboard"
          onOpenViewer={handleOpenViewer}
        />
        <DetailsPanelSlideOut projectsInfo={projectsInfo} scope="dashboard" />
      </SplitterPanel>
    </DetailsPanelSplitter>
  )
}

export default UserTasksContainer
