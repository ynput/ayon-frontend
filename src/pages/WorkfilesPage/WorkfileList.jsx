import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Section, TablePanel } from '@ynput/ayon-react-components'
import { CellWithIcon } from '@components/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useGetWorkfileListQuery } from '@queries/getWorkfiles'
import NoEntityFound from '@components/NoEntityFound'
import { setFocusedWorkfiles } from '@state/context'
import { useCallback, useRef } from 'react'
import { useTableKeyboardNavigation } from '@shared/containers/Feed'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import { confirmDelete } from '@shared/util'
import { toast } from 'react-toastify'
import { useDeleteWorkfileMutation } from '@queries/workfiles/deleteWorkfile'

const WorkfileList = ({ style }) => {
  const tableRef = useRef(null)
  const dispatch = useDispatch()
  const taskIds = useSelector((state) => state.context.focused.tasks)
  const pairing = useSelector((state) => state.context.pairing)
  const projectName = useSelector((state) => state.project.name)
  const focusedWorkfiles = useSelector((state) => state.context.focused.workfiles)

  const {
    data = [],
    isLoading,
    isError,
    error,
  } = useGetWorkfileListQuery({ projectName, taskIds }, { skip: !taskIds.length })

  const [deleteWorkfile] = useDeleteWorkfileMutation()

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

  const handleSelectionChange = (e) => {
    const value = e.value

    dispatch(setFocusedWorkfiles([value.id]))
  }

  // get selection using the first workfile id
  const selectedWorkfile = focusedWorkfiles && focusedWorkfiles[0]
  const selection = data.find((workfile) => workfile.id === selectedWorkfile)

  const handleTableKeyDown = useTableKeyboardNavigation({
    tableRef,
    treeData: data,
    selection: { [selectedWorkfile]: true },
    onSelectionChange: ({ array }) => handleSelectionChange({ value: { id: array[0] } }),
    config: { multiSelect: false },
  })

  // Create context menu items dynamically for a specific workfile
  const createContextMenuItems = useCallback(
    (workfile) => {
      if (!workfile) return []

      const onDeleteFile = () => {
        confirmDelete({
          label: workfile.name,
          accept: async () => {
            try {
              await deleteWorkfile({
                projectName,
                workfileId: workfile.id,
              }).unwrap()
              dispatch(setFocusedWorkfiles([]))
            } catch (error) {
              console.error(error)
              toast.error('Error deleting workfile')
            }
          },
        })
      }

      return [
        {
          label: 'Delete File',
          icon: 'delete',
          command: onDeleteFile,
          danger: true,
        },
      ]
    },
    [projectName, deleteWorkfile, dispatch],
  )

  const [globalContextMenuShow] = useCreateContextMenu([])

  const onContextMenu = useCallback(
    (e) => {
      const rowData = e.data
      if (!rowData) return

      // Update selection for visual feedback
      if (rowData.id !== selectedWorkfile) {
        dispatch(setFocusedWorkfiles([rowData.id]))
      }

      // Create menu items with the right-clicked workfile data
      const menuItems = createContextMenuItems(rowData)
      globalContextMenuShow(e.originalEvent, menuItems)
    },
    [selectedWorkfile, dispatch, globalContextMenuShow, createContextMenuItems],
  )
  

  if (isError) {
    console.error(error)
    return 'Error...'
  }

  return (
    <Section style={style}>
      <TablePanel loading={isLoading}>
        {!taskIds.length || !data.length ? (
          <NoEntityFound type="workfile" />
        ) : (
          <DataTable
            ref={tableRef}
            scrollable="true"
            scrollHeight="flex"
            selectionMode="single"
            responsive="true"
            dataKey="id"
            value={taskIds.length ? data : []}
            selection={selection}
            onSelectionChange={handleSelectionChange}
            onKeyDown={handleTableKeyDown}
            onContextMenu={onContextMenu}
            rowClassName={(rowData) => ({ ['id-' + rowData.id]: true })}
          >
            <Column field="name" header="Name" body={formatName} />
          </DataTable>
        )}
      </TablePanel>
    </Section>
  )
}

export default WorkfileList
