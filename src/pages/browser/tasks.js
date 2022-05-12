import { useEffect, useState, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'
import { Shade } from '../../components'
import { CellWithIcon } from '../../components/icons'

import { setFocusedTasks, setPairing } from '../../features/context'
import { groupResult } from '../../utils'

import axios from 'axios'

const TASKS_QUERY = `
query TasksByFolder($projectName: String!, $folderIds: [String!]!) {
  project(name: $projectName) {
    tasks(folderIds:$folderIds) {
      edges {
        node {
          id
          name
          taskType
          assignees
          folder {
            name
          }
        }
      }
    }
  }
}
`

const TasksPanel = () => {
  const dispatch = useDispatch()
  const context = useSelector((state) => ({ ...state.context }))
  const projectName = context.projectName
  const folderIds = context.focusedFolders

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const userName = useSelector((state) => state.user.name)

  //
  // Hooks
  //

  useEffect(() => {
    if (!folderIds.length) {
      setData([])
      setLoading(false)
      return
    }
    setLoading(true)
    let result = []
    axios
      .post('/graphql', {
        query: TASKS_QUERY,
        variables: { projectName, folderIds },
      })
      .then((response) => {
        if (
          !(response.data && response.data.data && response.data.data.project)
        )
          return

        for (const edge of response.data.data.project.tasks.edges) {
          result.push({
            id: edge.node.id,
            name: edge.node.name,
            folderName: edge.node.folder.name,
            taskType: edge.node.taskType,
            isMine: edge.node.assignees.includes(userName) ? 'yes' : '',
          })
        }
      })
      .finally(() => {
        setData(groupResult(result, 'name'))
        setLoading(false)
      })
    // eslint-disable-next-line
  }, [folderIds, projectName])

  const selectedTasks = useMemo(() => {
    const r = {}
    for (const tid of context.focusedTasks) r[tid] = true
    return r
  }, [context.focusedTasks])

  //
  // Handlers
  //

  const onSelectionChange = (event) => {
    const taskIds = Object.keys(event.value)
    let pairs = []
    for (const tid of taskIds) {
      pairs.push({
        taskId: tid,
      })
    }
    dispatch(setPairing(pairs))
    dispatch(setFocusedTasks(taskIds))
  }

  //
  // Render
  //

  const nameRenderer = (node) => {
    const icon = node.data.isGroup ? 'folder' : 'settings'
    let className = ''
    let i = 0
    for (const pair of context.pairing) {
      i++
      if (pair.taskId === node.data.id) {
        className = `row-hl-${i}`
        break
      }
    }

    return (
      <CellWithIcon
        icon={icon}
        text={node.data.name}
        iconClassName={className}
      />
    )
  }

  return (
    <section className="row" style={{ minHeight: 250, width: '100%' }}>
      <div className="wrapper">
        {loading && <Shade />}
        <TreeTable
          value={data}
          scrollable="true"
          scrollHeight="100%"
          emptyMessage="No tasks found"
          selectionMode="multiple"
          selectionKeys={selectedTasks}
          onSelectionChange={onSelectionChange}
        >
          <Column
            field="name"
            header="Task"
            expander="true"
            body={nameRenderer}
          />
          {folderIds.length > 1 && (
            <Column field="folderName" header="Folder" />
          )}
          <Column field="taskType" header="Task type" style={{ width: 90 }} />
          <Column field="isMine" header="Mine" style={{ width: 40 }} />
        </TreeTable>
      </div>
    </section>
  )
}

export default TasksPanel
