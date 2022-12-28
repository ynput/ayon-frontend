import ayonClient from '/src/ayon'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'

import AttributeTable from '/src/containers/attributeTable'
import { getTaskTypeIcon } from '/src/utils'
import { TagsField } from '/src/containers/fieldFormat'
import { Panel } from '@ynput/ayon-react-components'
import { setReload } from '../../features/context'
import StatusSelect from '../../components/status/statusSelect'

const TASK_QUERY = `
    query Tasks($projectName: String!, $tasks: [String!]!) {
        project(name: $projectName) {
            tasks(ids: $tasks) {
                edges {
                    node {
                        id
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

      // use operations end point to update all at once
      await axios.post(`/api/projects/${projectName}/operations`, { operations })
      // reload data for subsets
      // TODO: Only reload affected entities
      // TODO: Optimistic updates will remove this manula reload
      getTaskData()
      // dispatch callback function to reload data
    } catch (error) {
      console.error(error)
    }
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
          {
            title: 'Status',
            value: (
              <StatusSelect
                value={data.status}
                statuses={context.project.statuses}
                align={'right'}
                onChange={(v) => handleStatusChange(v, data.status, data)}
              />
            ),
          },
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
