import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

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

const TasksPanel = ({ folderId, projectName, userName }) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)


  useEffect(() => {
    setLoading(true)
    let result = []
    axios.post("/graphql", {query: TASKS_QUERY, variables: {projectName, folderId}})
    .then((response) => {
        if (!(response.data && response.data.data && response.data.data.project))
          return

        for (const edge of response.data.data.project.tasks.edges){
          result.push({
            name: edge.node.name,
            taskType: edge.node.taskType,
            isMine: edge.node.assignees.includes(userName) ? "yes" : "no"
          })
        }
      }
    )
    .finally(() => {
      setData(result)
      setLoading(false)
    })
    // eslint-disable-next-line
  }, [folderId])



  return (
    <section className="row" style={{ minHeight: 200, width: '100%' }}>
      <div className="wrapper">
        <DataTable 
          value={data}
          scrollable
          scrollHeight={200}
        >
          <Column field="name" header="Name"/>
          <Column field="taskType" header="Task type"/>
          <Column field="isMine" header="Mine"/>
        </DataTable>
      </div>
    </section>
  )
}

const TasksComponent = () => {
  const user = useSelector((state) => ({ ...state.userReducer }))
  const context = useSelector((state) => ({ ...state.contextReducer }))
  const projectName = context.projectName
  const showTasks = context.showTasks || null

  console.log('Show tasks', showTasks)

  if (!showTasks) return <></>

  return <TasksPanel projectName={projectName} folderId={showTasks} userName={user.name} />
}

export default TasksComponent
