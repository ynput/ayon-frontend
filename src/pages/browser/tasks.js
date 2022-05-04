import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Shade } from '../../components'

import axios from 'axios'

const TASKS_QUERY = `
query TasksByFolder($projectName: String!, $folderId: String!) {
  project(name: $projectName) {
    tasks(folderIds:[$folderId]) {
      edges {
        node {
          name
          taskType
          assignees
        }
      }
    }
  }
}
`

const sortByKey = (array, key) => {
  return array.sort(function (a, b) {
    var x = a[key]
    var y = b[key]
    return x < y ? -1 : x > y ? 1 : 0
  })
}

const TasksPanel = ({ folderId, projectName }) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const userName = useSelector((state) => state.user.name)

  useEffect(() => {
    setLoading(true)
    let result = []
    axios
      .post('/graphql', {
        query: TASKS_QUERY,
        variables: { projectName, folderId },
      })
      .then((response) => {
        if (
          !(response.data && response.data.data && response.data.data.project)
        )
          return

        for (const edge of response.data.data.project.tasks.edges) {
          result.push({
            name: edge.node.name,
            taskType: edge.node.taskType,
            isMine: edge.node.assignees.includes(userName) ? 'yes' : 'no',
          })
        }
      })
      .finally(() => {
        setData(sortByKey(result, 'name'))
        setLoading(false)
      })
    // eslint-disable-next-line
  }, [folderId])

  return (
    <section className="row" style={{ minHeight: 200, width: '100%' }}>
      <div className="wrapper">
        {loading && <Shade />}
        <DataTable value={data} scrollable scrollHeight={200}>
          <Column field="name" header="Name" />
          <Column field="taskType" header="Task type" />
          <Column field="isMine" header="Mine" />
        </DataTable>
      </div>
    </section>
  )
}

export default TasksPanel
