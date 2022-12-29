import { useSelector } from 'react-redux'
import AttributeTable from '/src/containers/attributeTable'
import { getTaskTypeIcon } from '/src/utils'
import { TagsField } from '/src/containers/fieldFormat'
import { Panel } from '@ynput/ayon-react-components'
import { useGetEntitiesDetailsQuery } from '../../services/ayon'
import StatusSelect from '../../components/status/statusSelect'

const TaskDetail = () => {
  const context = useSelector((state) => ({ ...state.context }))
  const projectName = context.projectName
  const focusedTasks = context.focused.tasks
  const taskId = focusedTasks.length === 1 ? focusedTasks[0] : null

  // GET RTK QUERY
  const {
    data: tasksData,
    isError,
    isLoading,
  } = useGetEntitiesDetailsQuery(
    {
      projectName,
      ids: [taskId],
      type: 'task',
    },
    { skip: !taskId },
  )

  if (isLoading) return 'loading..'

  if (isError) return 'ERROR: Soemthing went wrong...'

  const handleStatusChange = async (value, oldValue, entity) => {
    if (value === oldValue) return

    try {
      // create operations array of all entities
      // currently only supports changing one status
      const operations = [
        {
          type: 'update',
          entityType: 'task',
          entityId: entity.id,
          data: {
            status: value,
          },
        },
      ]

      // TODO set new status in RTK
    } catch (error) {
      console.error(error)
    }
  }

  if (focusedTasks.length > 1) {
    return (
      <Panel>
        <span>{focusedTasks.length} tasks selected</span>
      </Panel>
    )
  }

  const task = tasksData[0].node

  return (
    <Panel>
      <h3>
        <span className="material-symbols-outlined" style={{ verticalAlign: 'bottom' }}>
          {getTaskTypeIcon(task.taskType)}
        </span>
        <span style={{ marginLeft: 10 }}>{task.name}</span>
      </h3>
      <AttributeTable
        entityType="task"
        data={task.attrib}
        additionalData={[
          { title: 'Task Type', value: task.taskType },
          {
            title: 'Status',
            value: (
              <StatusSelect
                value={task.status}
                statuses={context.project.statuses}
                align={'right'}
                onChange={(v) => handleStatusChange(v, task.status, task)}
              />
            ),
          },
          { title: 'Tags', value: <TagsField value={task.tags} /> },
          {
            title: 'Assignees',
            value: task.assignees?.length ? task.assignees.join(', ') : '-',
          },
        ]}
      />
    </Panel>
  )
}

export default TaskDetail
