import ayonClient from '/src/ayon'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'

import AttributeTable from '/src/containers/attributeTable'
import { getTaskTypeIcon } from '/src/utils'
import { StatusField, TagsField } from '/src/containers/fieldFormat'
import { Panel } from '@ynput/ayon-react-components'
import { setReload } from '../../features/context'

const TASK_QUERY = `
    query Tasks($projectName: String!, $tasks: [String!]!) {
        project(name: $projectName) {
            tasks(ids: $tasks) {
                edges {
                    node {
                        name
                        status
                        tags
                        taskType
                        assignees
                        attrib {
                          #TASK_ATTRS#
                        }
                    }
                }
            }
        }
    }

`

const buildTaskQuery = () => {
  let f_attribs = ''
  for (const attrib of ayonClient.settings.attributes) {
    if (attrib.scope.includes('task')) f_attribs += `${attrib.name}\n`
  }
  return TASK_QUERY.replace('#TASK_ATTRS#', f_attribs)
}

const TaskDetail = () => {
  const dispatch = useDispatch()
  const context = useSelector((state) => ({ ...state.context }))
  const projectName = context.projectName
  const tasks = context.focused.tasks
  const taskId = tasks.length === 1 ? tasks[0] : null
  const [data, setData] = useState({})
  const query = buildTaskQuery()
  const variables = { projectName, tasks: [taskId] }

  const getTaskData = () => {
    if (!taskId) {
      setData({})
      return
    }

    axios.post('/graphql', { query, variables }).then((response) => {
      if (!(response.data.data && response.data.data.project)) {
        console.log('ERROR', data.errors[0].message)
        return
      }

      const edges = response.data.data.project.tasks.edges
      if (!edges.length) {
        // TODO: log 404
        return
      }

      setData(edges[0].node)
    })
    //eslint-disable-next-line
  }

  useEffect(() => {
    getTaskData()
  }, [projectName, taskId])

  const reload = context.reload.task

  useEffect(() => {
    if (reload) {
      // reloading task data
      console.log('reloading task data')
      // get task data
      getTaskData()
      // clear reload
      dispatch(setReload({ type: 'task', reload: false }))
    }
  }, [reload])

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
