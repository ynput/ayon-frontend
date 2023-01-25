import { useSelector } from 'react-redux'
import AttributeTable from '/src/containers/attributeTable'
import { getTaskTypeIcon } from '/src/utils'
import { TagsField } from '/src/containers/fieldFormat'
import { Panel } from '@ynput/ayon-react-components'
import { useUpdateEntitiesDetailsMutation } from '/src/services/updateEntitiesDetails'
import { useGetEntitiesDetailsQuery } from '/src/services/getEntitiesDetails'
import StatusSelect from '/src/components/status/statusSelect'
import usePubSub from '/src/hooks/usePubSub'

const TaskDetail = () => {
  const projectName = useSelector((state) => state.context.projectName)
  const focusedTasks = useSelector((state) => state.context.focused.tasks)
  const taskId = focusedTasks.length === 1 ? focusedTasks[0] : null

  // GET RTK QUERY
  const {
    data: tasksData,
    isError,
    isLoading,
    refetch,
  } = useGetEntitiesDetailsQuery(
    {
      projectName,
      ids: [taskId],
      type: 'task',
    },
    { skip: !taskId },
  )

  // PUBSUB HOOK
  usePubSub('entity.task', refetch, focusedTasks)

  // PATCH FOLDERS DATA
  const [updateTask] = useUpdateEntitiesDetailsMutation()

  if (isLoading) return 'loading..'

  if (isError) return 'ERROR: Soemthing went wrong...'

  const handleStatusChange = async (value, entity) => {
    try {
      const patches = [{ ...entity, status: value }]

      const payload = await updateTask({
        projectName,
        type: 'task',
        data: { status: value },
        patches,
      }).unwrap()

      console.log('fulfilled', payload)
    } catch (error) {
      console.error('rejected', error)
    }
  }

  if (focusedTasks.length > 1) {
    return (
      <Panel>
        <span>{focusedTasks.length} tasks selected</span>
      </Panel>
    )
  }

  const task = tasksData[0]?.node

  return (
    <Panel>
      <h3>
        <span className="material-symbols-outlined" style={{ verticalAlign: 'bottom' }}>
          {getTaskTypeIcon(task.taskType)}
        </span>
        <span style={{ marginLeft: 10 }}>{task.label || task.name}</span>
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
                align={'right'}
                onChange={(v) => handleStatusChange(v, task)}
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
