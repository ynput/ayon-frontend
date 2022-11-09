import { useEffect, useState, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Shade, Panel, TableWrapper, Section } from 'openpype-components'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'

import { CellWithIcon } from '/src/components/icons'
import { setFocusedTasks, setPairing } from '/src/features/context'
import { groupResult, getTaskTypeIcon } from '/src/utils'

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

const TaskList = ({ style = {} }) => {
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
        if (!response?.data?.data?.project) return

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
    const taskIds = Object.keys(event.value).filter((k) => k.length === 32)
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
    const icon = node.data.isGroup
      ? 'folder'
      : getTaskTypeIcon(node.data.taskType)
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
    <Section style={style}>
      <Panel className="nopad">
        <TableWrapper>
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
          </TreeTable>
        </TableWrapper>
      </Panel>
    </Section>
  )
}

export default TaskList
