import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { v1 as uuid1 } from 'uuid'
import {
  Spacer,
  Button,
  Section,
  Toolbar,
  TablePanel,
  InputSwitch,
} from '@ynput/ayon-react-components'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'
import { ContextMenu } from 'primereact/contextmenu'

import sortByKey from '/src/helpers/sortByKey'

import {
  editorSelectionChanged,
  setBreadcrumbs,
  setExpandedFolders,
  setFocusedFolders,
} from '/src/features/context'

import { getColumns, formatName, formatType, formatAttribute } from './utils'
import { stringEditor, typeEditor } from './editors'
import { MultiSelect } from 'primereact/multiselect'
import useLocalStorage from '/src/hooks/useLocalStorage'
import { useGetHierarchyQuery } from '/src/services/getHierarchy'
import SearchDropdown from '/src/components/SearchDropdown'
import useColumnResize from '/src/hooks/useColumnResize'
import { isEmpty } from 'lodash'
import {
  useGetEditorRootQuery,
  useLazyGetExpandedBranchQuery,
} from '/src/services/editor/getEditor'
import { ayonApi } from '/src/services/ayon'
import { useUpdateEditorMutation } from '/src/services/editor/updateEditor'
import usePubSub from '/src/hooks/usePubSub'
import { useLazyGetEntityQuery } from '/src/services/entity/getEntity'

const EditorPage = () => {
  const project = useSelector((state) => state.project)
  const { folders: foldersObject, tasks, folders } = project

  // eslint-disable-next-line no-unused-vars
  const context = useSelector((state) => ({ ...state.context }))
  const projectName = useSelector((state) => state.project.name)
  const focusedFolders = useSelector((state) => state.context.focused.folders)
  // focused editor is a mixture of focused folders and tasks
  const focusedEditor = useSelector((state) => state.context.focused.editor)
  const expandedFolders = useSelector((state) => state.context.expandedFolders)
  const focusedTasks = useSelector((state) => state.context.focused.tasks)

  const dispatch = useDispatch()

  const [changes, setChanges] = useState({})
  const [newNodes, setNewNodes] = useState([])
  const [errors, setErrors] = useState({})
  const [selectionLocked, setSelectionLocked] = useState(false)
  // SEARCH STATES
  // object with folderIds, task parentsIds and taskNames
  const [searchIds, setSearchIds] = useState({})

  // columns widths
  const [columnsWidths, setColumnWidths] = useColumnResize('editor')

  const contextMenuRef = useRef(null)

  // Hierarchy data is used for fast searching
  const { data: hierarchyData, isLoading: isSearchLoading } = useGetHierarchyQuery(
    { projectName },
    { skip: !projectName },
  )

  // get root folders/tasks for tree
  const {
    data: rootDataCache = {},
    isSuccess,
    isFetching,
    isLoading: isLoadingRoot,
  } = useGetEditorRootQuery({ projectName }, { skip: !projectName })

  // used to update nodes
  const [updateEditor, { isLoading: isUpdating }] = useUpdateEditorMutation()

  // use later on for loading new branches
  const [triggerGetExpandedBranch, { isFetching: isLoadingBranches }] =
    useLazyGetExpandedBranchQuery()

  const [triggerGetEntity] = useLazyGetEntityQuery()

  const loading = isLoadingRoot || isLoadingBranches || isSearchLoading || isUpdating

  // TODO changes aren't propagated to children

  // call loadNewBranches with an array of folder ids to get the branches and patch them into the rootData cache
  const loadNewBranches = async (folderIds, force) => {
    if (!folderIds.length) return

    // get new branches using id
    // if branches are already in cache, then rtk query won't be executed again
    try {
      // get new branches using id
      // get new events data
      for (const id of folderIds) {
        await triggerGetExpandedBranch(
          {
            projectName,
            parentId: id,
          },
          !force,
        )
      }
    } catch (error) {
      console.error(error)
    }
  }

  // OVERVIEW
  // 1. check entity has been expanded
  // 2. get entity data
  // 3. patch new entity data into rootDataCache
  const handlePubSub = async (topic = '', message) => {
    // check entity changing on current project
    if (!topic.includes('entity')) return
    if (message.project?.toLowerCase() !== projectName.toLowerCase()) return

    const entityId = message.summary.entityId
    const entityType = topic.split('.')[1]

    // check entityId is visible
    if (!(entityId in rootDataCache)) return console.log('entity not visible yet')

    // get entity data
    const res = await triggerGetEntity({ projectName, entityId, entityType }, false)
      .unwrap()
      .catch((err) => console.error(err))

    console.log('patching in new websocket entityData', res)
    // now patch in new data
    dispatch(
      ayonApi.util.updateQueryData('getEditorRoot', { projectName }, (draft) => {
        draft[entityId] = {
          data: {
            ...res,
            __parentId: res.folderId || res.parentId || 'root',
            __entityType: entityType,
          },
          leaf: rootDataCache[entityId].leaf,
        }
      }),
    )
  }

  const ids = useMemo(() => Object.keys(rootDataCache), [rootDataCache])

  usePubSub('entity.task', handlePubSub, ids, false)
  usePubSub('entity.folder', handlePubSub, ids, false)

  // when rootData is loaded, load expandedFolders for first time
  useEffect(() => {
    if (isSuccess) {
      // load expanded folders from initial context
      if (Object.keys(expandedFolders).length) {
        console.log('loading expanded folders context', expandedFolders)
        loadNewBranches(Object.keys(expandedFolders))
      }
    }
  }, [isSuccess, isFetching])

  //
  // Helpers
  //

  let columns = useMemo(() => getColumns(), [])

  const formatError = (rowData) => {
    // Format the error icon for the given row
    // If the row has no error, return null,
    // otherwise return the error icon with the error message
    // as tooltip.
    const error = errors[rowData.id]
    if (error) {
      return (
        <span
          className={`material-symbols-outlined`}
          style={{ color: 'var(--color-hl-error)' }}
          title={error}
        >
          warning
        </span>
      )
    }
  }

  // on first render, get selection from focused folders and tasks
  // for further selections, focusedEditor is used
  useEffect(() => {
    // if there are tasks focused, only select those
    if (focusedTasks.length) {
      dispatch(editorSelectionChanged({ selection: focusedTasks }))
      // if a task was focused in hierarchy then the folder must have been focused too
      // and therefore the folder would also have already been expanded in hierarchy
    } else {
      // otherwise, select the focused folders
      dispatch(editorSelectionChanged({ selection: focusedFolders }))
    }
  }, [])

  //
  // External events handling
  //

  // TODO - pubsub

  //
  // Build hierarchy
  //

  // console.log(searchIds)

  // make new copy of root data
  const rootData = useMemo(() => {
    let data = { ...rootDataCache }
    // merge in any new nodes
    Object.values(newNodes).forEach((n) => {
      // add new node
      data[n.id] = { leaf: n.__entityType !== 'folder', data: n }
      // make sure parent leaf = false
      if (data[n.parentId || n.folderId])
        data[n.parentId || n.folderId] = { ...data[n.parentId || n.folderId], leaf: false }
    })
    return data
  }, [rootDataCache, newNodes, changes])

  useEffect(() => {
    console.log('rootData changed', rootData)
  }, [rootData])

  // SEARCH FILTER
  // if search results filter out nodes
  const filteredNodeData = useMemo(() => {
    const filtered = { ...rootData }
    if (searchIds) {
      const { folderIds = [], taskNames = [] } = searchIds
      for (const key in filtered) {
        if (folderIds.length && !folderIds.includes(key)) {
          if (!filtered[key].leaf) {
            delete filtered[key]
          } else if (taskNames.length && !taskNames.includes(filtered[key].data.name)) {
            delete filtered[key]
          }
        }
      }
    }

    return filtered
  }, [rootData, searchIds])

  const parents = useMemo(() => {
    // This is an auto-generated object in the form of:
    //   { parentId: [child1Id, child2Id....]
    // It is updated when rootData changes and it speeds up
    // building hierarchy

    const result = {}
    for (const childId in filteredNodeData) {
      const parentId = filteredNodeData[childId].data.__parentId
      if (!(parentId in result)) result[parentId] = []
      result[parentId].push(childId)
    }
    return result
  }, [filteredNodeData, rootData])

  // Build hierarchical data for the TreeTable component
  // Trigger the rebuild when parents are updated (which are
  // updated after rootData update. Both rootData and parents
  // are needed for the hierarchy, so thi cascading makes
  // it possible)

  let treeData = useMemo(() => {
    if (isEmpty(parents)) {
      return []
    }
    const result = []

    const buildHierarchy = (parentId, target) => {
      if (!parents[parentId]) return
      for (const childId of parents[parentId]) {
        const node = {
          key: childId,
          name: rootData[childId].data?.name,
          data: rootData[childId].data,
          leaf: rootData[childId].leaf,
        }
        if (!node.leaf) {
          node.children = []
          if (childId in expandedFolders) buildHierarchy(childId, node.children)
        }
        target.push(node)
      }
    }

    buildHierarchy('root', result)
    return sortByKey(result, 'name')
  }, [parents, expandedFolders, rootData])

  let foundTasks = []
  const getFolderTaskList = (folders = [], parentId, d) => {
    let searchList = []
    let depth = d || 0
    folders.forEach((folder) => {
      searchList.push({
        id: folder.id,
        label: folder.name,
        value: folder.name,
        parentId: parentId,
        children: folder.children || [],
        taskNames: folder.taskNames,
        keywords: [folder.name, folder.folderType].map((k) => k.toLowerCase()),
        depth: depth,
        icon: foldersObject[folder.folderType]?.icon || 'folder',
        isTask: false,
        parents: folder.parents,
      })

      // add tasks to list if not already found
      folder.taskNames?.forEach((task) => {
        if (!foundTasks.includes(task)) {
          foundTasks.push(task)
          searchList.push({
            id: folder.id + task,
            label: task,
            value: task,
            icon: tasks[folder.taskType]?.icon || 'task',
            depth: depth + 1,
            keywords: [task],
            taskNames: [],
            isTask: true,
          })
        }
      })

      if (folder.children?.length) {
        searchList = searchList.concat(getFolderTaskList(folder.children, folder.id, depth + 1))
      }
    })

    return searchList
  }

  // create a flat list of everything searchable, folders and tasks
  let searchableFolders = useMemo(
    () => getFolderTaskList(hierarchyData).sort((a, b) => a.depth - b.depth),
    [hierarchyData],
  )

  // create a set that can be used to look up a specific id
  const searchableFoldersSet = useMemo(() => {
    const res = new Map()

    for (const folder of searchableFolders) {
      res.set(folder.id, {
        parent: folder.parentId,
        childrenLength: folder.childrenLength,
        name: folder.value,
        parents: folder.parents,
      })
    }

    return res
  }, [searchableFolders])

  const searchFilter = (search, suggestions) => {
    // filter through suggestions
    const filtered = suggestions.filter((folder) =>
      folder.keywords.some((key) => key.includes(search)),
    )
    return filtered
  }

  const handleSearchComplete = (result, search) => {
    let folderIds = [],
      taskNames = []
    let results = result

    // look for tasks in results and add matching folders
    result.forEach((res) => {
      if (!res.isTask) return

      // find all
      searchableFolders.forEach(
        (folder) =>
          folder.taskNames.includes(res.value) &&
          !folderIds.includes(folder.id) &&
          results.push(folder),
      )
    })

    // find all parent ids for each id
    results.forEach((folder) => {
      if (folder.isTask) return

      // add folder id
      folderIds.push(folder.id)

      // if folder has tasks add folderId and taskName
      if (folder.taskNames.length && folder.taskNames.some((n) => n.includes(search))) {
        // are any of the task names match with the search
        folder.taskNames.forEach(
          (name) => name.includes(search) && !taskNames.includes(name) && taskNames.push(name),
        )
      }
      // get folders parentId
      const getAllParents = (folder, id) => {
        const childId = id || folder.id
        const parentId = searchableFoldersSet.get(childId).parent
        if (parentId && !folderIds.includes(parentId)) {
          // add parent id
          folderIds.push(parentId)
          // see if parent id has it's own parentId
          getAllParents(folder, parentId)
        }
      }
      getAllParents(folder)

      const getAllChildren = (folder) => {
        // add all children and taskNames to folders
        folder.children?.forEach((child) => {
          if (!folderIds.includes(child.id)) folderIds.push(child.id)

          if (child.children) getAllChildren(child)
        })
      }
      getAllChildren(folder)
    })

    setSearchIds({ folderIds, taskNames })
  }

  const currentSelection = useMemo(() => {
    // This object holds the information on current selected nodes.
    // It has the same structure as rootData, e.g. {objecId: rootData, ...}
    // so it is compatible with the treetable selection argument and it
    // also provides complete node information
    const result = {}
    for (const key of focusedEditor) result[key] = rootData[key]

    return result
  }, [focusedEditor, rootData])

  //
  // Update handlers
  //

  const updateAttribute = (options, value) => {
    setChanges((changes) => {
      for (const id in currentSelection) {
        changes[id] = changes[id] || {
          __entityType: rootData[id].data.__entityType,
          __parentId: rootData[id].data.__parentId,
        }
        changes[id][options.field] = value
      }
      return changes
    })

    // Force table render when selection is locked
    if (selectionLocked) dispatch(setFocusedFolders(focusedFolders))
  }

  const updateName = (options, value) => {
    const id = options.rowData.id
    const rowChanges = changes[id] || {
      __entityType: options.rowData.__entityType,
      __parentId: options.rowData.__parentId,
    }
    rowChanges['_name'] = value
    setChanges((changes) => {
      return { ...changes, [id]: rowChanges }
    })
  }

  const updateType = (options, value) => {
    const id = options.rowData.id
    const rowChanges = changes[id] || {
      __entityType: options.rowData.__entityType,
      __parentId: options.rowData.__parentId,
    }
    const key = options.rowData.__entityType === 'folder' ? '_folderType' : '_taskType'
    rowChanges[key] = value
    setChanges((changes) => {
      return { ...changes, [id]: rowChanges }
    })
  }

  //
  // Commit changes
  //

  const onCommit = () => {
    const updates = []

    // PATCH / DELETE EXISTING ENTITIES

    for (const entityId in changes) {
      // check not changing new node
      if (entityId in newNodes) continue

      const entityType = changes[entityId].__entityType

      if (changes[entityId].__action === 'delete') {
        updates.push({
          id: entityId,
          type: 'delete',
          entityType,
          entityId,
        })
      } else {
        // End delete, begin patch
        const attribChanges = {}
        const entityChanges = {}

        for (const key in changes[entityId]) {
          if (key.startsWith('__')) continue
          if (key.startsWith('_')) entityChanges[key.substring(1)] = changes[entityId][key]
          else attribChanges[key] = changes[entityId][key]
        }

        // patch is original data with updated data
        const patch = {
          data: {
            ...rootData[entityId]?.data,
            ...entityChanges,
            attrib: { ...rootData[entityId]?.data?.attrib, ...attribChanges },
          },
          leaf: rootData[entityId]?.leaf,
        }

        updates.push({
          id: entityId,
          type: 'update',
          entityType,
          entityId,
          data: { ...entityChanges, attrib: attribChanges },
          patch,
        })
      } // Patch
    } // PATCH EXISTING ENTITIES

    //
    // CREATE NEW ENTITIES
    //

    const newNodesParentIds = Object.values(newNodes).map((n) => n.parentId || n.folderId)

    for (const id in newNodes) {
      const entity = newNodes[id]
      const entityType = entity.__entityType
      const newEntity = { ...entity }
      const entityChanges = changes[entity.id]

      // it is a new entity, so only valid attributes are those
      // stored in `changes`. The rest are inherited ones
      newEntity.attrib = {}
      let ownAttrib = []
      const parent = rootData[entity.parentId || entity.folderId]
      let patchAttrib = { ...parent?.data?.attrib } || {}
      for (const key in entityChanges || {}) {
        if (key.startsWith('__')) continue
        if (key.startsWith('_')) newEntity[key.substring(1)] = entityChanges[key]
        else {
          newEntity.attrib[key] = entityChanges[key]
          ownAttrib.push(key)
          patchAttrib[key] = entityChanges[key]
        }
      }

      const patch = {
        data: {
          ...newEntity,
          attrib: patchAttrib,
          ownAttrib,
        },
        leaf: !!entity.leaf,
      }

      // check if this newNode has any child newNodes (is it a parent)
      if (newNodesParentIds.includes(id)) {
        patch.data.hasChildren = true
        patch.leaf = false
      }

      updates.push({
        id: entity.id,
        entityId: entity.id,
        type: 'create',
        entityType,
        data: newEntity,
        patch,
      })

      if (!parent.data.hasChildren) {
        const parentPatch = { ...parent.data, hasTasks: entityType === 'task', hasChildren: true }

        // patch in new parent so that data about having children is updated
        // for example: a folder with no children gets a new child
        dispatch(
          ayonApi.util.updateQueryData('getEditorRoot', { projectName }, (draft) => {
            Object.assign(draft, {
              ...draft,
              [parent.data.id]: {
                data: parentPatch,
                leaf: false,
              },
            })
          }),
        )
      }
    } // CREATE NEW ENTITIES

    // Send the changes to the server

    updateEditor({ updates, projectName })
      .unwrap()
      .then((res) => {
        if (!res.success) {
          toast.warn('Errors occurred during save')
        } else {
          toast.success('Changes saved')
        }

        setErrors(() => {
          const result = {}
          for (const op of res.operations) {
            if (!op.success) result[op.id] = op.error
          }
          return result
        })

        // reset newNodes
        setNewNodes({})
        // reset changes
        setChanges({})
      })
      .catch((err) => {
        toast.error("Unable to save changes. This shouldn't happen.")
        console.error(err)
      })
  }

  //
  // Adding new nodes
  //

  const futureParents = useMemo(() => {
    // Returns a list of node ids from the current selection
    // for which children creation is available
    let parents = []
    for (const parentId in currentSelection) {
      const node = currentSelection[parentId]
      if (!node) continue
      // unable to add children to unsaved nodes
      if (node.data.id?.startsWith('newnode')) continue
      // unable to add children to tasks
      if (node.data.__entityType !== 'folder') continue
      parents.push(parentId)
    }
    return parents
  }, [currentSelection])

  const canAdd = futureParents.length > 0
  const canCommit = !isEmpty(changes) || !isEmpty(newNodes)

  const addNode = (entityType, root) => {
    const parents = root ? [null] : futureParents

    if (!parents.length) {
      console.log('Nothing to add')
      return
    }

    setNewNodes((nodes) => {
      let newNodes = {}
      for (const parentId of parents) {
        const newNodeId = uuid1().replace(/-/g, '')
        const newNode = {
          leaf: true,
          name: `New${entityType}`,
          id: newNodeId,
          attrib: { ...(rootData[parentId]?.data.attrib || {}) },
          ownAttrib: [],
          __entityType: entityType,
          __parentId: parentId || 'root',
        }
        if (entityType === 'folder') newNode['parentId'] = parentId
        else if (entityType === 'task') {
          newNode['folderId'] = parentId
          newNode['taskType'] = 'Generic'
        }
        newNodes[newNodeId] = newNode
      }
      return { ...nodes, ...newNodes }
    })

    if (!root) {
      // Update expanded folders context object
      const exps = { ...expandedFolders }
      const loadBranches = []
      for (const id of parents) {
        exps[id] = true
        if (rootData[id]?.data?.hasChildren) {
          loadBranches.push(id)
        }
      }
      dispatch(setExpandedFolders(exps))
      // get new branch
      loadNewBranches(loadBranches)
    }
  } // Add node

  //
  // Other user events handlers (Toolbar)
  //

  const removeIdsFromState = (setState, ids) => {
    // revert (remove) any changes
    setState((nodes) => {
      const result = {}
      for (const id in nodes) {
        if (!ids.includes(id)) result[id] = nodes[id]
      }
      return result
    })
  }

  const onDelete = () => {
    const newIds = Object.keys(newNodes).filter((i) => i in currentSelection)
    const modifiedIds = Object.keys(currentSelection).filter((i) => !newIds.includes(i))

    // remove from newNodes state
    removeIdsFromState(setNewNodes, newIds)

    // set changes delete op for left over ids
    setChanges((changes) => {
      for (const id of modifiedIds) {
        changes[id] = changes[id] || {
          __entityType: rootData[id].data.__entityType,
          __parentId: rootData[id].data.__parentId,
        }
        changes[id].__action = 'delete'
      }
      return changes
    })
  }

  const onRevert = () => {
    setChanges({})
    setNewNodes({})
  }

  const revertChangesOnSelection = useCallback(() => {
    const modifiedIds = Object.keys(changes).filter((i) => i in currentSelection)
    const newIds = Object.keys(newNodes).filter((i) => i in currentSelection)

    // remove from newNodes state
    removeIdsFromState(setNewNodes, newIds)

    // remove from changes state
    removeIdsFromState(setChanges, modifiedIds)
  }, [currentSelection, changes, newNodes])

  const onAddFolder = () => addNode('folder')
  const onAddRootFolder = () => addNode('folder', true)
  const onAddTask = () => addNode('task')

  // Context menu

  const onContextMenuSelectionChange = (event) => {
    // TODO: handle tasks
    if (!(event.value in currentSelection)) {
      dispatch(setFocusedFolders([event.value]))
    }
  }

  const contextMenuModel = useMemo(() => {
    return [
      {
        label: 'Copy attributes',
        disabled: Object.keys(currentSelection) !== 1,
        command: () => alert('Not implemented'),
      },
      {
        label: 'Paste attributes',
        disabled: true,
        command: () => alert('Not implemented'),
      },
      {
        label: 'Revert changes',
        command: revertChangesOnSelection,
      },
      {
        label: 'Delete',
        command: onDelete,
      },
    ]
  }, [currentSelection])

  //
  // Table event handlers
  //

  const onToggle = async (event) => {
    // updated expanded folders context object
    dispatch(setExpandedFolders(event.value))

    let newIds = Object.keys(event.value)
    // filter out ids that are already in the expandedFolders object
    newIds = newIds.filter((id) => !(id in expandedFolders))

    // load new branches
    loadNewBranches(newIds)
  }

  const onSelectionChange = (event) => {
    // block new selection if the selection is locked
    if (selectionLocked) return

    const selection = Object.keys(event.value)
    // reduce into two arrays, one with type folder and one with type task
    const folders = []
    const tasks = []
    for (const [key, value] of Object.entries(event.value)) {
      if (rootData[key]?.data.__entityType === 'folder' && value) folders.push(key)
      else if (rootData[key]?.data.__entityType === 'task' && value) tasks.push(key)
    }

    // for each task in tasks, add __parentId to folders if not already there
    for (const task of tasks) {
      const folder = rootData[task].data.__parentId
      if (!folders.includes(folder)) folders.push(folder)
    }

    // update redux store
    dispatch(editorSelectionChanged({ folders, tasks, selection }))
  }

  const onRowClick = (event) => {
    let node = event.node.data
    if (node.__entityType === 'folder') {
      node = event.node.data
    } else if (node.__entityType === 'task') {
      // find the parent folder
      node = searchableFoldersSet.get(node.__parentId)
      console.log(node)
    }

    if (node) {
      dispatch(
        setBreadcrumbs({
          parents: node.parents,
          folder: node.name,
        }),
      )
    }
  }

  const filterOptions = [{ name: 'name' }, { name: 'type' }, ...columns].map(({ name }) => ({
    value: name,
    label: name,
  }))
  const allColumnsNames = filterOptions.map(({ value }) => value)

  const [shownColumns, setShownColumns] = useLocalStorage(
    'editor-columns-filter-single',
    allColumnsNames,
  )

  const handleColumnsFilter = (e) => {
    e.preventDefault()
    const newArray = e.target.value || []

    if (newArray.length) {
      // make sure there's always at least one column

      setShownColumns(newArray)
    }
  }

  const handleColumnReorder = (e) => {
    const localStorageOrder = e.columns.reduce(
      (acc, cur, i) => ({ ...acc, [cur.props.field]: i }),
      {},
    )

    localStorage.setItem('editor-columns-order', JSON.stringify(localStorageOrder))
  }

  let allColumns = [
    <Column
      field="name"
      key="name"
      header="Name"
      expander={true}
      body={(rowData) => formatName(rowData.data, changes, true, project)}
      style={{ width: columnsWidths['name'], maxWidth: 300, height: 33 }}
      editor={(options) => {
        return stringEditor(
          options,
          updateName,
          formatName(options.rowData, changes, false, project),
        )
      }}
    />,
    <Column
      field="type"
      key="type"
      header="Type"
      body={(rowData) => formatType(rowData.data, changes)}
      style={{ width: columnsWidths['type'], maxWidth: 200 }}
      editor={(options) => {
        return typeEditor(
          options,
          updateType,
          formatType(options.rowData, changes, false),
          folders,
          tasks,
        )
      }}
    />,
    ...columns.map((col) => (
      <Column
        key={col.name}
        header={col.title}
        field={col.name}
        style={{ width: columnsWidths[col.name] }}
        body={(rowData) => formatAttribute(rowData.data, changes, col.name)}
        editor={(options) => {
          return col.editor(
            options,
            updateAttribute,
            formatAttribute(options.rowData, changes, col.name, false),
            col.editorSettings,
          )
        }}
      />
    )),
  ]

  // sort columns if localstorage set
  let columnsOrder = localStorage.getItem('editor-columns-order')
  if (columnsOrder) {
    try {
      columnsOrder = JSON.parse(columnsOrder)
      allColumns.sort((a, b) => columnsOrder[a.props.field] - columnsOrder[b.props.field])
    } catch (error) {
      console.log(error)
      // remove local stage
      localStorage.removeItem('editor-columns-order')
    }
  }

  // only filter columns if required
  if (shownColumns.length < allColumns.length) {
    allColumns = allColumns.filter(({ props }) => shownColumns.includes(props.field))
  }

  // sort columns

  //
  // Render the TreeTable

  return (
    <main>
      <Section>
        <Toolbar>
          <Button
            icon="create_new_folder"
            label="Add folder"
            disabled={!canAdd}
            onClick={onAddFolder}
          />
          <Button icon="add_task" label="Add task" disabled={!canAdd} onClick={onAddTask} />
          <Button icon="create_new_folder" label="Add root folder" onClick={onAddRootFolder} />
          <Button label="Delete selected" icon="delete" onClick={onDelete} />

          <Spacer />
          <Button icon="close" label="Revert Changes" onClick={onRevert} disabled={!canCommit} />
          <Button icon="check" label="Commit Changes" onClick={onCommit} disabled={!canCommit} />
        </Toolbar>
        <Toolbar>
          <SearchDropdown
            filter={searchFilter}
            suggestions={searchableFolders}
            suggestionsLimit={5}
            onSubmit={handleSearchComplete}
            onClear={() => searchIds && setSearchIds({})}
            isLoading={isSearchLoading}
          />
          <MultiSelect
            options={filterOptions}
            value={shownColumns}
            onChange={handleColumnsFilter}
            placeholder={`Show Columns`}
            fixedPlaceholder={shownColumns.length >= filterOptions.length}
            style={{ maxWidth: 200 }}
          />
          <InputSwitch
            checked={selectionLocked}
            onChange={() => setSelectionLocked(!selectionLocked)}
            style={{ width: 40, marginLeft: 10 }}
          />
          Lock selection
        </Toolbar>
        <TablePanel loading={loading}>
          <ContextMenu model={contextMenuModel} ref={contextMenuRef} />
          <TreeTable
            responsive="true"
            scrollable
            scrollHeight="100%"
            value={treeData}
            resizableColumns
            columnResizeMode="expand"
            expandedKeys={expandedFolders}
            onToggle={onToggle}
            selectionMode="multiple"
            selectionKeys={currentSelection}
            onSelectionChange={onSelectionChange}
            onRowClick={onRowClick}
            rowClassName={(rowData) => {
              return {
                changed: rowData.key in changes || rowData.key?.startsWith('newnode'),
                deleted: rowData.key in changes && changes[rowData.key]?.__action == 'delete',
              }
            }}
            selectOnEdit={false}
            onContextMenu={(e) => contextMenuRef.current.show(e.originalEvent)}
            onContextMenuSelectionChange={onContextMenuSelectionChange}
            onColumnResizeEnd={setColumnWidths}
            reorderableColumns
            onColReorder={handleColumnReorder}
            rows={20}
          >
            {allColumns}
            <Column
              field="error"
              header=""
              body={(rowData) => formatError(rowData.data)}
              style={{ width: 24 }}
            />
          </TreeTable>
        </TablePanel>
      </Section>
    </main>
  )
}

export default EditorPage
