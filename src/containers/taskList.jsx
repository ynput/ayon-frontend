import { useState, useMemo, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { TablePanel, Section } from '@ynput/ayon-react-components'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'

import EntityDetail from './DetailsDialog'
import { CellWithIcon } from '@components/icons'
import { setFocusedTasks, setPairing, setUri, updateBrowserFilters } from '@state/context'
import { toast } from 'react-toastify'
import { useGetTasksQuery } from '@queries/getTasks'
import useCreateContext from '@hooks/useCreateContext'
import NoEntityFound from '@components/NoEntityFound'

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

      const matchedTasks = tasksData.filter((task) => previousTasksNames.includes(task.data.name))

      const matchedTasksIds = matchedTasks.map((task) => task.data.id)
      const matchedTasksNames = matchedTasks.map((task) => task.data.name)

      dispatch(setFocusedTasks({ ids: matchedTasksIds, names: matchedTasksNames }))
      // set pairing
      setPairs(matchedTasksIds)
    }
  }, [folderIds, isFetching, autoSelect, tasksData, dispatch])

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

  const dispatchFocusedTasks = (taskId) => {
    dispatch(setPairing([{ taskId: taskId }]))
    dispatch(setFocusedTasks({ ids: [taskId] }))
  }

  const handleFilterProductsBySelected = (selected = []) => {
    // get taskTypes based on selected tasks
    const taskTypes = selected.map(
      (taskId) => tasksData.find((task) => task.data.id === taskId)?.data?.taskType,
    )

    // filter out duplicates
    const uniqueTaskTypes = [...new Set(taskTypes)]

    dispatch(updateBrowserFilters({ productTaskTypes: uniqueTaskTypes }))
  }

  // CONTEXT MENU
  const ctxMenuItems = (selected = []) => [
    {
      label: `Filter products by task${selected.length > 1 ? 's' : ''}`,
      icon: 'filter_list',
      command: () => handleFilterProductsBySelected(selected),
    },
    {
      label: 'Detail',
      command: () => setShowDetail(true),
      icon: 'database',
    },
  ]

  const onContextMenu = (event) => {
    let newFocused = [...focusedTasks]
    const itemId = event.node.data.id
    if (itemId && !focusedTasks?.includes(itemId)) {
      // if the selection does not include the clicked node, new selection is the clicked node
      newFocused = [itemId]
      // update selection state
      dispatchFocusedTasks(itemId)
    }

    ctxMenuShow(event.originalEvent, ctxMenuItems(newFocused))
  }

  const [ctxMenuShow] = useCreateContext([])

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
    const isActive = node.data.active
    const isGroup = node.data.isGroup

    const generateIcon = () => {
      if (!isActive) return 'visibility_off'
      if (isGroup) return 'folder'
      return tasksTypes[node.data.taskType]?.icon
    }

    let className = ''

    // Apply color styles only if item is active, the inactive item will remain gray
    if (isActive) {
      let i = 0
      for (const pair of pairing) {
        i++
        if (pair.taskId === node.data.id) {
          className = `row-hl-${i}`
          break
        }
      }
    }

    const opacityStyle = isActive ? { opacity: 1 } : { opacity: 0.5 }

    return (
      <CellWithIcon
        icon={generateIcon()}
        text={node.data.label}
        iconClassName={className}
        name={node.data.name}
        iconStyle={opacityStyle}
        textStyle={opacityStyle}
      />
    )
  }

  const renderTaskType = (node) => {
    const isActive = node.data.active
    const taskType = node.data.taskType
    const resolveActiveOpacity = { opacity: isActive ? 1 : 0.3 }
    return <span style={resolveActiveOpacity}>{taskType}</span>
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
            onSelectionChange={(e) => onSelectionChange(e)}
            onContextMenu={(e) => onContextMenu(e)}
            onRowClick={onRowClick}
            className={isFetching ? 'table-loading' : undefined}
            onClick={handleDeselect}
            ref={tableRef}
          >
            <Column field="name" header="Task" expander="true" body={nameRenderer} />
            {folderIds.length > 1 && <Column field="folderName" header="Folder" />}
            <Column
              field="taskType"
              header="Task type"
              style={{ width: 90 }}
              body={renderTaskType}
            />
          </TreeTable>
        )}
      </TablePanel>
    </Section>
  )
}

export default TaskList
