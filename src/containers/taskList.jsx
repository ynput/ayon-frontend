import { useState, useMemo, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { TablePanel, Section } from '@ynput/ayon-react-components'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'

import { DetailsDialog, useVersionUploadContext } from '@shared/components'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import { useTableKeyboardNavigation, extractIdFromClassList } from '@shared/containers/Feed'
import { setFocusedTasks, setPairing, setUri, updateBrowserFilters } from '@state/context'
import { toast } from 'react-toastify'
import { useGetTasksQuery } from '@queries/getTasks'
import NoEntityFound from '@components/NoEntityFound'
import { openViewer } from '@/features/viewer'
import clsx from 'clsx'
import useTableLoadingData from '@hooks/useTableLoadingData'
import { useEntityListsContext } from '@pages/ProjectListsPage/context'
import { CellWithIcon } from '@components/icons'

const TaskList = ({ style = {}, autoSelect = false }) => {
  const tasksTypes = useSelector((state) => state.project.tasks)

  const dispatch = useDispatch()

  const projectName = useSelector((state) => state.project.name)
  const folderIds = useSelector((state) => state.context.focused.folders)
  const focusedTasks = useSelector((state) => state.context.focused.tasks)
  const previousTasksNames = useSelector((state) => state.context.focused.tasksNames)
  const pairing = useSelector((state) => state.context.pairing)
  const userName = useSelector((state) => state.user.name)

  const { onOpenVersionUpload } = useVersionUploadContext()

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
      const matchedTasksSubTypes = matchedTasks.map((task) => task.data.taskType)

      dispatch(
        setFocusedTasks({
          ids: matchedTasksIds,
          names: matchedTasksNames,
          subTypes: matchedTasksSubTypes,
        }),
      )
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

    const names = [],
      subTypes = []
    for (const tid of taskIds) {
      const task = tasksData.find((t) => t.data?.id === tid)
      if (task) {
        names.push(task.data?.name)
        subTypes.push(task.data?.taskType)
      }
    }

    dispatch(setFocusedTasks({ ids: taskIds, names, subTypes }))
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

  // viewer open
  const viewerIsOpen = useSelector((state) => state.viewer.isOpen)

  const openInViewer = (id, quickView) => {
    if (id && !viewerIsOpen) {
      dispatch(openViewer({ taskId: id, projectName: projectName, quickView }))
    }
  }
  const handleTableKeyDown = useTableKeyboardNavigation({
    tableRef,
    treeData: tasksData,
    selection: selectedTasks,
    onSelectionChange: ({ object }) => onSelectionChange({ value: object }),
  })

  const handleKeyDown = (event) => {
    if (event.key === ' ') {
      event.preventDefault()
      const firstSelected = Object.keys(selectedTasks)[0]
      openInViewer(firstSelected, true)
    }

    // if using arrow keys change selection
    handleTableKeyDown(event)
  }

  const {
    buildAddToListMenu,
    buildListMenuItem,
    newListMenuItem,
    tasks: tasksLists,
    buildHierarchicalMenuItems,
  } = useEntityListsContext()

  // CONTEXT MENU
  const ctxMenuItems = (selected = []) => {
    const firstSelected = selected[0]
    const firstSelectedData = tasksData.find((task) => task.data.id === firstSelected)
    const selectedEntities = selected.map((id) => ({ entityId: id, entityType: 'task' }))

    return [
      {
        label: 'Open in viewer',
        icon: 'play_circle',
        shortcut: 'Spacebar',
        command: () => openInViewer(selected[0], false),
      },
      {
        label: 'Upload version',
        icon: 'upload',
        command: () =>
          onOpenVersionUpload?.({
            taskId: selected[0],
            folderId: firstSelectedData?.data?.folderId,
          }),
        disabled: selected.length !== 1,
        hidden: !onOpenVersionUpload,
      },
      {
        label: `Filter products by task${selected.length > 1 ? 's' : ''}`,
        icon: 'filter_list',
        command: () => handleFilterProductsBySelected(selected),
      },
      buildAddToListMenu([
        ...buildHierarchicalMenuItems(
          tasksLists,
          selectedEntities,
          () => false, // icons optional - hide for compactness
        ),
        newListMenuItem('task', selectedEntities),
      ]),
      {
        label: 'Detail',
        command: () => setShowDetail(true),
        icon: 'database',
      },
    ]
  }

  const [ctxMenuShow] = useCreateContextMenu()

  const onContextMenu = (event) => {
    let newFocused = [...focusedTasks]
    const itemId = event.node.data.id
    if (itemId && !focusedTasks?.includes(itemId)) {
      // if the selection does not include the clicked node, new selection is the clicked node
      newFocused = [itemId]
      const subType = event.node.data.taskType
      const name = event.node.data.name
      // update selection state
      dispatch(setPairing([{ taskId: itemId }]))
      dispatch(setFocusedTasks({ ids: [itemId], subTypes: [subType], names: [name] }))
    }

    ctxMenuShow(event.originalEvent, ctxMenuItems(newFocused))
  }

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

  const handleDeselect = (e) => {
    const tableRefElement = tableRef.current?.getElement()

    const tableHeader = tableRefElement?.querySelector('table')
    const table = tableRefElement?.querySelector('.p-treetable-scrollable-body-table')

    // check if e.target is inside either table or tableHeader
    // do nothing
    if (tableHeader?.contains(e.target) || table?.contains(e.target)) return

    // deselect all
    dispatch(setFocusedTasks({ ids: [], names: [], subTypes: [] }))
    // remove paring
    dispatch(setPairing([]))
  }

  const tableData = useTableLoadingData(tasksData, isFetching, 6)

  const noTasks = !isFetching && tasksData.length === 0

  //
  // Render
  //

  return (
    <Section style={style}>
      <TablePanel>
        <DetailsDialog
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
            value={tableData}
            scrollable="true"
            scrollHeight="100%"
            emptyMessage=" "
            selectionMode="multiple"
            selectionKeys={selectedTasks}
            onSelectionChange={onSelectionChange}
            onContextMenu={onContextMenu}
            className={clsx({ loading: isFetching })}
            ref={tableRef}
            rowClassName={(rowData) => ({
              ['id-' + rowData.key]: true,
              compact: true,
              loading: isFetching,
            })}
            pt={{
              root: {
                onKeyDown: handleKeyDown,
                onClick: handleDeselect,
              },
            }}
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
