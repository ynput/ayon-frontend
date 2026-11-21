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
import type { EditorTaskNode, TableRow } from '../types/table'
import { getCellId } from '../utils/cellUtils'
import {
  TaskCardChange,
  TaskColumnsContextValue,
  TaskColumnsSelection,
  useTaskColumnsContext,
  useTaskColumnsSelection,
} from './TaskColumnsContextInstance'
import * as Styled from './TaskColumnCell.styled'

const NO_TASKS: EditorTaskNode[] = []
// a card's picker, once the card can be edited
const PICKER_SELECTOR = '.tag.editable'
// the collapsed card's design height, less the 2px it can lose without clipping
const TASK_CARD_HEIGHT = 32

interface TaskCardProps extends Pick<TaskColumnsContextValue, 'statuses' | 'priorities' | 'users'> {
  task: EditorTaskNode
  projectName: string
  icon?: string
  isExpanded: boolean
  // below the card's own height the collapsed card is scaled down to the row
  zoom?: number
  // the page's task filter does not match the task
  isDimmed: boolean
  // picked out of the cell's cards: the others are not selected
  isPicked: boolean
  // each field's picker is there when the field can be edited
  onChange?: (task: EditorTaskNode, change: TaskCardChange) => void
  readOnlyFields?: string[]
  // several task cells are selected, and the edit goes to all their tasks: their assignees
  selection?: TaskColumnsSelection
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
    isDimmed,
    isPicked,
    onChange,
    readOnlyFields,
    selection,
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
        getSelectableAssignees(users, selection?.assignees || task.assignees).map(
          ({ name, fullName }) => ({ name, fullName, avatarUrl: `/api/users/${name}/avatar` }),
        ),
      [users, task.assignees, selection],
    )
    const canEdit = (field: string) => !!onChange && !readOnlyFields?.includes(field)
    // the project's icons, statuses and priorities are typed more loosely than the card's props
    const cardIcon = icon as EntityCardProps['titleIcon']
    const statusOptions = statuses as EntityCardProps['statusOptions']
    const priorityOptions = priorities as EntityCardProps['priorityOptions']

    return (
      <Styled.Card
        className={clsx({ dimmed: isDimmed, picked: isPicked })}
        data-task-id={task.id}
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
          pt={{
            assigneeSelect: selection
              ? {
                  // several tasks: the picker shows every assignee they have and on how many
                  // of them, and what it adds or removes goes to each task
                  value: selection.assignees,
                  multiSelectClose: false,
                  isMultiple: selection.assignees.length > 1,
                  mixedCounts: selection.assigneeCounts,
                  mixedTotal: selection.tasks.length,
                  mixedLabel: 'tasks',
                  onMixedChange: ({ add, remove }) =>
                    onChange?.(task, { field: 'assignees', added: add, removed: remove }),
                }
              : // one task: the picker gives the whole new list
                { multiSelectClose: false, multipleOverride: true },
          }}
          onAssigneeChange={
            canEdit('assignees')
              ? (assignees) =>
                  !selection && onChange?.(task, { field: 'assignees', value: assignees })
              : undefined
          }
          onStatusChange={
            canEdit('status')
              ? ([status]) => onChange?.(task, { field: 'status', value: status })
              : undefined
          }
          onPriorityChange={
            canEdit('attrib_priority')
              ? ([priority]) => onChange?.(task, { field: 'priority', value: priority })
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
}

/**
 * A folder row's tasks of one type, one card each, side by side. The cards edit their own task
 * (never the row's folder), so the cell is read-only to the table: no cell editor, paste or clear.
 * The table selects the cell; in a cell with several cards a press picks the pressed one. An edit
 * on a selected card goes to the tasks of all selected cards.
 */
export const TaskColumnCell = ({ row, columnId, taskType, readOnlyFields }: TaskColumnCellProps) => {
  const context = useTaskColumnsContext()
  const selection = useTaskColumnsSelection()
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
  // the cell's picked cards; without picks a selected cell has all its cards
  const picks = isSelected ? selection.picks[cellId] : undefined
  const isCardSelected = (taskId: string) => isSelected && (!picks || picks.includes(taskId))
  // the press that selects a card makes it editable before the click arrives, which would open
  // the picker under the pointer on that same click
  const wasSelectedOnPress = useRef(false)
  const swallowClick = useRef(false)

  const isExpanded = !!folder && !!context?.isRowExpanded(row.id)
  // the cell is the row less its borders
  const cardSpace = rowHeight - 2

  const editTasks = context?.editTasks
  const handleChange = useMemo(
    () =>
      canEdit && editTasks
        ? (task: EditorTaskNode, change: TaskCardChange) => editTasks(task, row.id, change)
        : undefined,
    [canEdit, editTasks, row.id],
  )

  const handlePress = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    // an open picker's list is the cell's in React only (a portal), or sits inside the card:
    // a press in it picks an option, not a card
    if (target.closest('.options') || !e.currentTarget.contains(target)) return
    const taskId = target.closest<HTMLElement>('[data-task-id]')?.dataset.taskId
    if (taskId) context?.notePressedTask(cellId, taskId)
    const isOnPicker = !!target.closest(PICKER_SELECTOR)
    const additive = e.metaKey || e.ctrlKey
    if (e.detail < 2) {
      const wasSelected = !!taskId && isCardSelected(taskId)
      wasSelectedOnPress.current = wasSelected
      swallowClick.current = !wasSelected || additive || e.shiftKey
      // a press on a selected card's picker edits what is selected: nothing is picked anew
      if (wasSelected && isOnPicker && !additive && !e.shiftKey) return
      const keepsSelection = context?.pressCard(
        cellId,
        taskId,
        (tasks || NO_TASKS).map((task) => task.id),
        { isCellSelected: isSelected, additive, range: e.shiftKey },
      )
      // the cell stays selected and only its cards changed: not the table's press
      if (keepsSelection) e.stopPropagation()
      return
    }
    // A double click opens the details panel on the task, as on Task progress. Handled on the
    // press: the first one re-renders the cell, and the dblclick event is not sure to follow.
    // Left to the picker when both clicks went to one of a card that could already be edited.
    if ((wasSelectedOnPress.current && isOnPicker) || !taskId) return
    swallowClick.current = true
    context?.openDetails()
  }

  return (
    <Styled.Cell
      id={cellId}
      className={clsx('readonly', 'task-column-cell', { loading: isLoading, expanded: isExpanded })}
      style={{ '--task-type-color': taskType.color } as CSSProperties}
      tabIndex={0}
      onMouseDownCapture={handlePress}
      onClickCapture={(e) => swallowClick.current && e.stopPropagation()}
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
              isDimmed={context.isTaskDimmed(task)}
              isPicked={!!picks?.includes(task.id)}
              // as on Task progress, a card is edited once it is selected
              onChange={isCardSelected(task.id) ? handleChange : undefined}
              readOnlyFields={readOnlyFields}
              selection={
                // several selected cards are edited together; a greyed out one by itself
                selection.tasks.length > 1 && selection.taskIds.has(task.id) ? selection : undefined
              }
            />
          ))
        ))}
    </Styled.Cell>
  )
}
