import axios from 'axios'
import { useState, useEffect } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Section, TablePanel } from '@ynput/ayon-react-components'
import { CellWithIcon } from '/src/components/icons'

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
      <TablePanel loading={loading}>
        <DataTable
          scrollable="true"
          scrollHeight="flex"
          selectionMode="single"
          responsive="true"
          dataKey="id"
          value={data}
          selection={selectedWorkfile}
          onSelectionChange={(e) => setSelectedWorkfile(e.value)}
        >
          <Column field="name" header="Name" body={formatName} />
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default WorkfileList
