import { CSSProperties, memo, useMemo, useRef } from 'react'
import type { EntityCardProps } from '@ynput/ayon-react-components'
import type { Row } from '@tanstack/react-table'
import clsx from 'clsx'
import { FilmstripEntityCard } from '@shared/components/Filmstrip/FilmstripEntityCard'
import { useProjectContext } from '@shared/context'
import { getEntityFilmstripUrl, getEntityThumbnailUrl, getSelectableAssignees } from '@shared/util'
import { useColumnSettingsContext } from '../context/column-settings'
import { useProjectTableContext } from '../context/project-table'
import { useSelectionCellsContext } from '../context/selection-cells'
import type { EditorTaskNode, EntityData, TableRow } from '../types/table'
import type { EntityUpdate } from '../hooks/useUpdateTableData'
import { getCellId } from '../utils/cellUtils'
import { useTaskColumnsContext, TaskColumnsContextValue } from './TaskColumnsContextInstance'
import * as Styled from './TaskColumnCell.styled'

type TaskUpdate = Pick<EntityUpdate, 'field' | 'value' | 'isAttrib'>

const NO_TASKS: EditorTaskNode[] = []
// the collapsed card's design height, less the 2px it can lose without clipping
const TASK_CARD_HEIGHT = 32

interface TaskCardProps extends Pick<TaskColumnsContextValue, 'statuses' | 'priorities' | 'users'> {
  task: EditorTaskNode
  projectName: string
  icon?: string
  isExpanded: boolean
  // below the card's own height the collapsed card is scaled down to the row
  zoom?: number
  // each field's picker is there when the field can be edited
  onChange?: (task: EditorTaskNode, update: TaskUpdate) => void
  readOnlyFields?: string[]
}

// one task of the cell: the Task progress page's card
const TaskCard = memo(
  ({
    task,
    projectName,
    icon,
    isExpanded,
    zoom,
    statuses,
    priorities,
    users,
    onChange,
    readOnlyFields,
  }: TaskCardProps) => {
    const entity = { projectName, entityType: 'task', entityId: task.id } as const
    const thumbnailUrl = isExpanded
      ? getEntityThumbnailUrl({ ...entity, thumbnailHash: task.thumbnailHash })
      : null
    const filmstripUrl =
      isExpanded && task.hasReviewables
        ? getEntityFilmstripUrl({ ...entity, thumbnailHash: task.thumbnailHash })
        : null

    const assigneeOptions = useMemo(
      () =>
        getSelectableAssignees(users, task.assignees).map(({ name, fullName }) => ({
          name,
          fullName,
          avatarUrl: `/api/users/${name}/avatar`,
        })),
      [users, task.assignees],
    )
    const canEdit = (field: string) => !!onChange && !readOnlyFields?.includes(field)
    // the project's icons, statuses and priorities are typed more loosely than the card's props
    const cardIcon = icon as EntityCardProps['titleIcon']
    const statusOptions = statuses as EntityCardProps['statusOptions']
    const priorityOptions = priorities as EntityCardProps['priorityOptions']

    return (
      <Styled.Card
        data-tooltip={task.label || task.name}
        data-tooltip-delay={250}
        style={zoom && zoom < 1 ? { zoom } : undefined}
      >
        <FilmstripEntityCard
          variant="status"
          title={task.label || task.name}
          titleIcon={cardIcon}
          imageIcon={cardIcon}
          imageUrl={thumbnailUrl ?? undefined}
          filmstripUrl={filmstripUrl}
          users={task.assignees.map((name) => ({ name }))}
          assigneeOptions={assigneeOptions}
          status={statusOptions?.find((status) => status.name === task.status)}
          statusOptions={statusOptions}
          statusMiddle
          statusNameOnly
          priority={priorityOptions?.find((priority) => priority.value === task.attrib?.priority)}
          priorityOptions={priorityOptions}
          isPlayable={task.hasReviewables}
          // the picker gives the whole new list (one task is edited, never a mixed selection)
          pt={{ assigneeSelect: { multiSelectClose: false, multipleOverride: true } }}
          onAssigneeChange={
            canEdit('assignees')
              ? (assignees) =>
                  onChange?.(task, { field: 'assignees', value: [...new Set(assignees)] })
              : undefined
          }
          onStatusChange={
            canEdit('status')
              ? ([status]) => onChange?.(task, { field: 'status', value: status })
              : undefined
          }
          onPriorityChange={
            canEdit('attrib_priority')
              ? ([priority]) =>
                  onChange?.(task, { field: 'priority', value: priority, isAttrib: true })
              : undefined
          }
          style={{ width: 'unset', aspectRatio: 'unset' }}
          isCollapsed={!isExpanded}
          isActive
          tabIndex={undefined}
        />
      </Styled.Card>
    )
  },
)
TaskCard.displayName = 'TaskCard'

interface TaskColumnCellProps {
  row: Row<TableRow>
  columnId: string
  taskType: { name: string; icon?: string; color?: string }
  readOnlyFields?: string[]
  updateEntities?: (entity: EntityUpdate) => void
}

/**
 * A folder row's tasks of one type, one card each, side by side. The cards edit their own task
 * (never the row's folder), so the cell is read-only to the table: no cell editor, paste or clear.
 */
export const TaskColumnCell = ({
  row,
  columnId,
  taskType,
  readOnlyFields,
  updateEntities,
}: TaskColumnCellProps) => {
  const context = useTaskColumnsContext()
  const { projectName } = useProjectContext()
  const { isRowReadOnly, readOnly: isTableReadOnly } = useProjectTableContext()
  const { isCellSelected } = useSelectionCellsContext()
  const { rowHeight = TASK_CARD_HEIGHT } = useColumnSettingsContext()

  const cellId = getCellId(row.id, columnId)
  const { primary, group, metaType, isLoading } = row.original
  const folder =
    context && !group && !metaType && !isLoading && primary.entityType === 'folder'
      ? primary
      : undefined
  // undefined while the folder loads; a folder without tasks has nothing to load
  const tasks = !folder
    ? undefined
    : folder.hasTasks === false
    ? NO_TASKS
    : context?.getTasks(folder.id, taskType.name)
  // as on Task progress, a card is edited once it is selected: the first click only selects
  const isSelected = isCellSelected(cellId)
  const canEdit = isSelected && !isTableReadOnly && !isRowReadOnly(row.id)
  // the press that selects the cell makes its cards editable before the click arrives, which
  // would open the picker under the pointer on that same click
  const wasSelectedOnPress = useRef(false)

  const isExpanded = !!folder && !!context?.isRowExpanded(row.id)
  // the cell is the row less its borders
  const cardSpace = rowHeight - 2

  const handleChange = useMemo(
    () =>
      canEdit && updateEntities
        ? (task: EditorTaskNode, update: TaskUpdate) =>
            // the task is the target, whatever is selected: without it the edit would go to
            // the row's folder, and with the selection to the Status column of other rows
            updateEntities({
              ...update,
              id: task.id,
              rowId: row.id,
              type: 'task',
              entityData: task as unknown as EntityData,
            })
        : undefined,
    [canEdit, updateEntities, row.id],
  )

  return (
    <Styled.Cell
      id={cellId}
      className={clsx('readonly', 'task-column-cell', { loading: isLoading, expanded: isExpanded })}
      style={{ '--task-type-color': taskType.color } as CSSProperties}
      tabIndex={0}
      onMouseDownCapture={() => (wasSelectedOnPress.current = isSelected)}
      onClickCapture={(e) => !wasSelectedOnPress.current && e.stopPropagation()}
    >
      {folder &&
        context &&
        (!tasks ? (
          <Styled.Loading className="loading" />
        ) : !tasks.length ? (
          // a folder that has tasks, none of this type; parent folders stay blank
          folder.hasTasks && <Styled.Empty />
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              projectName={projectName}
              icon={taskType.icon}
              isExpanded={isExpanded}
              zoom={!isExpanded && cardSpace < TASK_CARD_HEIGHT ? cardSpace / TASK_CARD_HEIGHT : 1}
              statuses={context.statuses}
              priorities={context.priorities}
              users={context.users}
              onChange={handleChange}
              readOnlyFields={readOnlyFields}
            />
          ))
        ))}
    </Styled.Cell>
  )
}
