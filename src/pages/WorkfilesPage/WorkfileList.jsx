import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Section, TablePanel } from '@ynput/ayon-react-components'
import { CellWithIcon } from '/src/components/icons'
import { useSelector } from 'react-redux'
import { useGetWorkfileListQuery } from '../../services/getWorkfiles'
import NoEntityFound from '/src/components/NoEntityFound'

const WorkfileList = ({ selectedWorkfile, setSelectedWorkfile, style }) => {
  const taskIds = useSelector((state) => state.context.focused.tasks)
  const pairing = useSelector((state) => state.context.pairing)
  const projectName = useSelector((state) => state.project.name)

  const {
    data = [],
    isLoading,
    isError,
    error,
  } = useGetWorkfileListQuery({ projectName, taskIds }, { skip: !taskIds.length })

  if (isError) {
    console.error(error)
    return 'Error...'
  }

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
        name={rowData.path}
      />
    )
  }

  return (
    <Section style={style}>
      <TablePanel loading={isLoading}>
        {!taskIds.length || !data.length ? (
          <NoEntityFound type="workfile" />
        ) : (
          <DataTable
            scrollable="true"
            scrollHeight="flex"
            selectionMode="single"
            responsive="true"
            dataKey="id"
            value={taskIds.length ? data : []}
            selection={selectedWorkfile}
            onSelectionChange={(e) => setSelectedWorkfile(e.value)}
          >
            <Column field="name" header="Name" body={formatName} />
          </DataTable>
        )}
      </TablePanel>
    </Section>
  )
}

export default WorkfileList
