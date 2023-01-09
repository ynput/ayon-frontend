import { useState, useMemo, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { TablePanel, Section } from '@ynput/ayon-react-components'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'
import { ContextMenu } from 'primereact/contextmenu'

import EntityDetail from '/src/containers/entityDetail'
import { CellWithIcon } from '/src/components/icons'
import { setFocusedTasks, setPairing, setDialog } from '/src/features/context'
import { getTaskTypeIcon } from '/src/utils'
import { toast } from 'react-toastify'
import { useGetTasksQuery } from '/src/services/getTasks'

const TaskList = ({ style = {} }) => {
  const dispatch = useDispatch()
  const context = useSelector((state) => ({ ...state.context }))
  const projectName = context.projectName
  const folderIds = context.focused.folders
  const focusedTasks = context.focused.tasks

  const userName = useSelector((state) => state.user.name)
  const ctxMenuRef = useRef(null)
  const [showDetail, setShowDetail] = useState(false)

  //
  // Hooks
  //

  const {
    data = [],
    isLoading,
    isError,
    error,
  } = useGetTasksQuery({ projectName, folderIds, userName })

  const selectedTasks = useMemo(() => {
    const r = {}
    for (const tid of focusedTasks) r[tid] = true
    return r
  }, [focusedTasks])

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

  const onContextMenuSelectionChange = (event) => {
    if (focusedTasks.includes(event.value)) return
    dispatch(setPairing([{ taskId: event.value }]))
    dispatch(setFocusedTasks([event.value]))
  }

  //
  // Render
  //

  const nameRenderer = (node) => {
    const icon = node.data.isGroup ? 'folder' : getTaskTypeIcon(node.data.taskType)
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
        text={node.data.label || node.data.name}
        iconClassName={className}
      />
    )
  }

  const ctxMenuModel = [
    {
      label: 'Detail',
      command: () => setShowDetail(true),
    },
    {
      label: 'Edit Tags',
      command: () =>
        dispatch(
          setDialog({
            type: 'tags',
          }),
        ),
    },
  ]

  if (isError) {
    toast.error(`Unable to load tasks. ${error}`)

    return <>Error</>
  }

  return (
    <Section style={style}>
      <TablePanel loading={isLoading}>
        <ContextMenu model={ctxMenuModel} ref={ctxMenuRef} />
        <EntityDetail
          projectName={projectName}
          entityType="task"
          entityIds={focusedTasks}
          visible={showDetail}
          onHide={() => setShowDetail(false)}
        />
        <TreeTable
          value={data}
          scrollable="true"
          scrollHeight="100%"
          emptyMessage="No tasks found"
          selectionMode="multiple"
          selectionKeys={selectedTasks}
          onSelectionChange={onSelectionChange}
          onContextMenu={(e) => ctxMenuRef.current?.show(e.originalEvent)}
          onContextMenuSelectionChange={onContextMenuSelectionChange}
        >
          <Column field="name" header="Task" expander="true" body={nameRenderer} />
          {folderIds.length > 1 && <Column field="folderName" header="Folder" />}
          <Column field="taskType" header="Task type" style={{ width: 90 }} />
        </TreeTable>
      </TablePanel>
    </Section>
  )
}

export default TaskList
