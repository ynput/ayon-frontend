import ayonClient from '/src/ayon'
import { useSelector } from 'react-redux'
import AttributeTable from '/src/containers/attributeTable'
import { getTaskTypeIcon } from '/src/utils'
import { StatusField, TagsField } from '/src/containers/fieldFormat'
import { Panel } from '@ynput/ayon-react-components'
import { useGetEntitiesDetailsQuery } from '../../services/ayon'

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
      attributes: ayonClient.settings.attributes,
      type: 'task',
    },
    { skip: !taskId },
  )

  if (isLoading) return 'loading..'

  if (isError) return 'ERROR: Soemthing went wrong...'

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
          { title: 'Status', value: <StatusField value={task.status} /> },
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
