import { useSelector } from 'react-redux'
import AttributeTable from '/src/containers/attributeTable'
import { TagsField } from '/src/containers/fieldFormat'
import { Panel } from '@ynput/ayon-react-components'
import { useUpdateEntitiesDetailsMutation } from '../../../services/entity/updateEntity'
import { useGetEntitiesDetailsQuery } from '../../../services/entity/getEntity'
import StatusSelect from '/src/components/status/statusSelect'
import usePubSub from '/src/hooks/usePubSub'
import AssigneeSelect from '../../../components/assignee/AssigneeSelect'

const TaskDetail = () => {
  const tasks = useSelector((state) => state.project.tasks)
  const projectName = useSelector((state) => state.project.name)
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

  const handleChange = async (value, field, entity) => {
    try {
      const patches = [{ ...entity, [field]: value }]

      const payload = await updateTask({
        projectName,
        type: 'task',
        data: { [field]: value },
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

  const task = tasksData && tasksData[0] && tasksData[0].node

  if (!task) return null

  return (
    <Panel>
      <h3>
        <span className="material-symbols-outlined" style={{ verticalAlign: 'bottom' }}>
          {tasks[task.taskType]?.icon}
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
                onChange={(v) => handleChange(v, 'status', task)}
              />
            ),
          },
          { title: 'Tags', value: <TagsField value={task.tags} /> },
          {
            title: 'Assignees',
            value: (
              <AssigneeSelect
                names={task.assignees}
                editor
                align={'right'}
                onChange={(v) => handleChange(v, 'assignees', task)}
              />
            ),
          },
        ]}
      />
    </Panel>
  )
}

export default TaskDetail
