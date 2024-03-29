import { useState, useMemo, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { TablePanel, Section } from '@ynput/ayon-react-components'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'

import EntityDetail from '/src/containers/entityDetail'
import { CellWithIcon } from '/src/components/icons'
import { setFocusedTasks, setPairing, setUri } from '/src/features/context'
import { toast } from 'react-toastify'
import { useGetTasksQuery } from '/src/services/getTasks'
import useCreateContext from '../hooks/useCreateContext'
import NoEntityFound from '../components/NoEntityFound'

const TaskList = ({ style = {}, autoSelect = false }) => {
  const tasksTypes = useSelector((state) => state.project.tasks)

  const dispatch = useDispatch()

  const projectName = useSelector((state) => state.project.name)
  const folderIds = useSelector((state) => state.context.focused.folders)
  const focusedTasks = useSelector((state) => state.context.focused.tasks)
  const previousTasksNames = useSelector((state) => state.context.focused.tasksNames)
  const pairing = useSelector((state) => state.context.pairing)
  const userName = useSelector((state) => state.user.name)

  const [showDetail, setShowDetail] = useState(false)

  const tableRef = useRef(null)

  //
  // Hooks
  //

  let {
    data: tasksData = [],
    isFetching,
    isError,
  } = useGetTasksQuery({ projectName, folderIds, userName }, { skip: !folderIds.length })

  const selectedTasks = useMemo(() => {
    const r = {}
    for (const tid of focusedTasks) r[tid] = true
    return r
  }, [focusedTasks])

  // when folder selection changes try to keep the same task(name) selected
  useEffect(() => {
    if (autoSelect && !isFetching && tasksData.length && previousTasksNames.length) {
      // filter out tasks with different names to
      const matchedTasksIds = tasksData
        .filter((task) => previousTasksNames.includes(task.data.name))
        .map((task) => task.data.id)

      dispatch(setFocusedTasks({ ids: matchedTasksIds }))
      // set pairing
      setPairs(matchedTasksIds)
    }
  }, [folderIds, isFetching, autoSelect, previousTasksNames, tasksData, dispatch])

  //
  // Handlers
  //

  const setPairs = (taskIds) => {
    let pairs = []
    for (const tid of taskIds) {
      pairs.push({
        taskId: tid,
      })
    }
    dispatch(setPairing(pairs))
  }

  const onSelectionChange = (event) => {
    const taskIds = Object.keys(event.value).filter((k) => k.length === 32)

    setPairs(taskIds)

    const names = []
    for (const tid of taskIds) {
      const task = tasksData.find((t) => t.data?.id === tid)
      if (task) names.push(task.data?.name)
    }

    dispatch(setFocusedTasks({ ids: taskIds, names }))
  }

  const onContextMenuSelectionChange = (event) => {
    if (focusedTasks.includes(event.value)) return
    dispatch(setPairing([{ taskId: event.value }]))
    dispatch(setFocusedTasks({ ids: [event.value] }))
  }

  // CONTEXT MENU
  const ctxMenuItems = [
    {
      label: 'Detail',
      command: () => setShowDetail(true),
      icon: 'database',
    },
  ]

  const [ctxMenuShow] = useCreateContext(ctxMenuItems)

  // create 10 dummy rows
  const loadingData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      key: i,
      data: {},
    }))
  }, [])

  //
  // Render
  //

  const nameRenderer = (node) => {
    const icon = node.data.isGroup ? 'folder' : tasksTypes[node.data.taskType]?.icon
    let className = ''
    let i = 0
    for (const pair of pairing) {
      i++
      if (pair.taskId === node.data.id) {
        className = `row-hl-${i}`
        break
      }
    }

    return (
      <CellWithIcon
        icon={icon}
        text={node.data.label}
        iconClassName={className}
        name={node.data.name}
      />
    )
  }

  if (isError) {
    toast.error(`Unable to load tasks.`)
    return <>Error</>
  }

  const onRowClick = (event) => {
    const node = event.node.data
    let uri = `ayon+entity://${projectName}/${node.folderPath}`
    uri += `?task=${node.name}`
    dispatch(setUri(uri))
  }

  const handleDeselect = (e) => {
    const tableRefElement = tableRef.current?.getElement()

    const tableHeader = tableRefElement?.querySelector('table')
    const table = tableRefElement?.querySelector('.p-treetable-scrollable-body-table')

    // check if e.target is inside either table or tableHeader
    // do nothing
    if (tableHeader?.contains(e.target) || table?.contains(e.target)) return

    // deselect all
    dispatch(setFocusedTasks({ ids: [], names: [] }))
    // remove paring
    dispatch(setPairing([]))
  }

  if (isFetching) {
    tasksData = loadingData
  }

  const noTasks = !isFetching && tasksData.length === 0

  return (
    <Section style={style}>
      <TablePanel>
        <EntityDetail
          projectName={projectName}
          entityType="task"
          entityIds={focusedTasks}
          visible={showDetail}
          onHide={() => setShowDetail(false)}
        />
        {noTasks ? (
          <NoEntityFound type="task" />
        ) : (
          <TreeTable
            value={tasksData}
            scrollable="true"
            scrollHeight="100%"
            emptyMessage=" "
            selectionMode="multiple"
            selectionKeys={selectedTasks}
            onSelectionChange={onSelectionChange}
            onContextMenu={(e) => ctxMenuShow(e.originalEvent)}
            onContextMenuSelectionChange={onContextMenuSelectionChange}
            onRowClick={onRowClick}
            className={isFetching ? 'table-loading' : undefined}
            onClick={handleDeselect}
            ref={tableRef}
          >
            <Column field="name" header="Task" expander="true" body={nameRenderer} />
            {folderIds.length > 1 && <Column field="folderName" header="Folder" />}
            <Column field="taskType" header="Task type" style={{ width: 90 }} />
          </TreeTable>
        )}
      </TablePanel>
    </Section>
  )
}

export default TaskList
