import axios from 'axios'
import { useSelector } from 'react-redux'
import { useState, useEffect } from 'react'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

import { Section, Panel, TableWrapper } from '/src/components'
import { CellWithIcon } from '/src/components/icons'
import Hierarchy from '/src/containers/hierarchy'
import TaskList from '/src/containers/taskList'

const WORKFILES_QUERY = `
query WorkfilesByTask($projectName: String!, $taskIds: [String!]!) {
  project(name: $projectName) {
    workfiles(taskIds:$taskIds) {
      edges {
        node {
          id
          taskId
          name
          path
        }
      }
    }
  }
}
`

const WorkfileDetail = ({ projectName, workfileId, style }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!workfileId) {
      setData(null)
      return
    }

    setLoading(true)
    axios
      .get(`/api/projects/${projectName}/workfiles/${workfileId}`)
      .then((res) => {
        setData(res.data)
      })
      .catch((err) => {
        console.log(err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [projectName, workfileId])

  return (
    <Section style={style}>
      <Panel>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </Panel>
    </Section>
  )
}

const WorkfileList = ({
  projectName,
  taskIds,
  pairing,
  selectedWorkfile,
  setSelectedWorkfile,
  style,
}) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!taskIds.length) {
      setData([])
      setLoading(false)
      return
    }
    console.log(taskIds)
    setLoading(true)
    let result = []
    axios
      .post('/graphql', {
        query: WORKFILES_QUERY,
        variables: { projectName, taskIds },
      })
      .then((response) => {
        if (!response?.data?.data?.project) {
          console.error(response)
          return
        }

        for (const edge of response.data.data.project.workfiles.edges) {
          result.push({
            id: edge.node.id,
            taskId: edge.node.taskId,
            name: edge.node.name,
            path: edge.node.path,
          })
        }
        setData(result)
      })
      .catch((error) => {
        console.log(error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [taskIds])

  const formatName = (rowData) => {
    let className = ''
    let i = 0

    for (const pair of pairing) {
      i++
      if (pair.taskId === rowData.taskId) {
        className = `row-hl-${i}`
        break
      }
    }

    return (
      <CellWithIcon
        icon="engineering"
        iconClassName={className}
        text={rowData.name}
        tooltip={rowData.path}
      />
    )
  }

  return (
    <Section style={style}>
      <Panel className="nopad">
        <TableWrapper>
          <DataTable
            scrollable="true"
            scrollHeight="flex"
            selectionMode="single"
            responsive="true"
            dataKey="id"
            value={data}
            loading={loading}
            selection={selectedWorkfile}
            onSelectionChange={(e) => setSelectedWorkfile(e.value)}
          >
            <Column field="name" header="Name" body={formatName} />
          </DataTable>
        </TableWrapper>
      </Panel>
    </Section>
  )
}

const WorkfilesPage = () => {
  const [selectedWorkfile, setSelectedWorkfile] = useState(null)

  const context = useSelector((state) => ({ ...state.context }))
  const projectName = context.projectName
  const folderTypes = context.project.folderTypes
  const expandedFolders = context.expandedFolders
  const focusedFolders = context.focusedFolders
  const focusedTasks = context.focusedTasks
  const pairing = context.pairing

  return (
    <main>
      <Hierarchy
        projectName={projectName}
        folderTypes={folderTypes}
        focusedFolders={focusedFolders}
        expandedFolders={expandedFolders}
        style={{ maxWidth: 500, minWidth: 300 }}
      />

      <TaskList style={{ maxWidth: 400, minWidth: 400 }} />

      <WorkfileList
        projectName={projectName}
        taskIds={focusedTasks}
        pairing={pairing}
        selectedWorkfile={selectedWorkfile}
        setSelectedWorkfile={setSelectedWorkfile}
        style={{ maxWidth: 400, minWidth: 300 }}
      />

      <WorkfileDetail
        projectName={projectName}
        workfileId={selectedWorkfile?.id}
      />
    </main>
  )
}

export default WorkfilesPage
