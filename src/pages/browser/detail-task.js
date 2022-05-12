import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'

import AttributeTable from '../../containers/attributeTable'
import {getTaskTypeIcon} from '../../utils'

const TASK_QUERY = `
    query Tasks($projectName: String!, $tasks: [String!]!) {
        project(name: $projectName) {
            tasks(ids: $tasks) {
                edges {
                    node {
                        name
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

const buildTaskQuery = (attributes) => {
  let f_attribs = ''
  for (const attrib of attributes) {
    if (attrib.scope.includes('task')) f_attribs += `${attrib.name}\n`
  }
  return TASK_QUERY.replace('#TASK_ATTRS#', f_attribs)
}

const TaskDetail = () => {
  const context = useSelector((state) => ({ ...state.context }))
  const settings = useSelector((state) => ({ ...state.settings }))
  const projectName = context.projectName
  const tasks = context.focusedTasks
  const taskId = tasks.length === 1 ? tasks[0] : null
  const [data, setData] = useState({})

  useEffect(() => {
    const query = buildTaskQuery(settings.attributes)
    const variables = { projectName, tasks: [taskId] }

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
  }, [projectName, taskId])

  if (tasks.length > 1) {
    return (
      <section className="column">
        <span>{tasks.length} tasks selected</span>
      </section>
    )
  }

  return (
    <section style={{ flexGrow: 1 }}>
      <h3>
        <span 
          className="material-symbols-outlined color-ternary"
          style={{ verticalAlign: 'bottom' }}
        >
          {getTaskTypeIcon(data.taskType)}
        </span>
        <span style={{ marginLeft: 10 }}>{data.name}</span>
      </h3>
      <AttributeTable
        entityType="task"
        attribSettings={settings.attributes}
        data={data.attrib}
      />
    </section>
  )
}

export default TaskDetail
