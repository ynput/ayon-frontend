import { useEffect } from 'react'
import { useFetch } from 'use-http'
import { useSelector } from 'react-redux'

const TASKS_QUERY = `
query TasksByFolder($projectName: String!, $folderId: String!) {
  project(name: $projectName) {
    tasks(folderIds:[$folderId]) {
      edges {
        node {
          name
          taskType
        }
      }
    }
  }
}
`

const TasksPanel = ({ folderId, projectName }) => {
  const { data, loading, request } = useFetch('graphql')

  useEffect(() => {
    request.query(TASKS_QUERY, { projectName, folderId })
    // eslint-disable-next-line
  }, [folderId])

  if (!(data && data.data && data.data.project)) return <></>

  const edges = data.data.project.tasks.edges

  return (
    <section className="row" style={{ minHeight: 150, width: '100%' }}>
      <div className="wrapper" style={{ overflowY: 'scroll' }}>
        <ul>
          {edges.map((edge, idx) => (
            <li key={idx}>
              {edge.node.name} ({edge.node.taskType})
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

const TasksComponent = () => {
  const context = useSelector((state) => ({ ...state.contextReducer }))
  const projectName = context.projectName
  const showTasks = context.showTasks || null

  console.log('Show tasks', showTasks)

  if (!showTasks) return <></>

  return <TasksPanel projectName={projectName} folderId={showTasks} />
}

export default TasksComponent
