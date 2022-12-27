import ayonClient from '/src/ayon'
import { useSelector } from 'react-redux'
import AttributeTable from '/src/containers/attributeTable'
import { getTaskTypeIcon } from '/src/utils'
import { StatusField, TagsField } from '/src/containers/fieldFormat'
import { Panel } from '@ynput/ayon-react-components'
import { useGetTaskDetailsQuery } from '../../services/ayon'

const TaskDetail = () => {
  const context = useSelector((state) => ({ ...state.context }))
  const projectName = context.projectName
  const tasks = context.focused.tasks
  const taskId = tasks.length === 1 ? tasks[0] : null

  const { data, isError, isLoading } = useGetTaskDetailsQuery(
    {
      projectName,
      tasks: [taskId],
      attributes: ayonClient.settings.attributes,
    },
    { skip: !taskId },
  )

  if (isLoading) return '...loading'

  if (isError) return '...ERROR: Soemthing went wrong :-('

  if (tasks.length > 1) {
    return (
      <Panel>
        <span>{tasks.length} tasks selected</span>
      </Panel>
    )
  }

  return (
    <Panel>
      <h3>
        <span className="material-symbols-outlined" style={{ verticalAlign: 'bottom' }}>
          {getTaskTypeIcon(data.taskType)}
        </span>
        <span style={{ marginLeft: 10 }}>{data.name}</span>
      </h3>
      <AttributeTable
        entityType="task"
        data={data.attrib}
        additionalData={[
          { title: 'Task Type', value: data.taskType },
          { title: 'Status', value: <StatusField value={data.status} /> },
          { title: 'Tags', value: <TagsField value={data.tags} /> },
          {
            title: 'Assignees',
            value: data.assignees && data.assignees.length ? data.assignees.join(', ') : '-',
          },
        ]}
      />
    </Panel>
  )
}

export default TaskDetail
