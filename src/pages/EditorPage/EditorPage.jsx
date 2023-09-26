import { useEffect, useState, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { v1 as uuid1 } from 'uuid'
import {
  Spacer,
  Button,
  Section,
  Toolbar,
  TablePanel,
  SaveButton,
} from '@ynput/ayon-react-components'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'

import sortByKey from '/src/helpers/sortByKey'

import { editorSelectionChanged, setUri, setExpandedFolders } from '/src/features/context'

import { getColumns, formatType, formatAttribute } from './utils'
import { MultiSelect } from 'primereact/multiselect'
import useLocalStorage from '/src/hooks/useLocalStorage'
import { useGetHierarchyQuery } from '/src/services/getHierarchy'
import SearchDropdown from '/src/components/SearchDropdown'
import useColumnResize from '/src/hooks/useColumnResize'
import { capitalize, debounce, isEmpty } from 'lodash'
import { useLazyGetExpandedBranchQuery } from '/src/services/editor/getEditor'
import { useUpdateEditorMutation } from '/src/services/editor/updateEditor'
import usePubSub from '/src/hooks/usePubSub'
import { useLazyGetEntityQuery } from '/src/services/entity/getEntity'
import {
  newNodesAdded,
  newProject,
  nodesUpdated,
  onForceChange,
  onNewChanges,
  onRevert,
} from '/src/features/editor'
import EditorPanel from './EditorPanel'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import NameField from './fields/NameField'
import { useGetAttributesQuery } from '/src/services/attributes/getAttributes'
import NewEntity from './NewEntity'
import checkName from '/src/helpers/checkName'
import useCreateContext from '/src/hooks/useCreateContext'
import { ayonApi } from '/src/services/ayon'
import { confirmDialog } from 'primereact/confirmdialog'
import BuildHierarchyButton from '/src/containers/HierarchyBuilder'
import NewSequence from './NewSequence'
import useShortcuts from '/src/hooks/useShortcuts'

const EditorPage = () => {
  const project = useSelector((state) => state.project)
  const { folders: foldersObject, tasks = [], attrib } = project

  // eslint-disable-next-line no-unused-vars
  // const context = useSelector((state) => ({ ...state.context }))
  const projectName = useSelector((state) => state.project.name)
  const focusedFolders = useSelector((state) => state.context.focused.folders)
  // focused editor is a mixture of focused folders and tasks
  const focusedEditor = useSelector((state) => state.context.focused.editor)
  const expandedFolders = useSelector((state) => state.context.expandedFolders)
  const focusedTasks = useSelector((state) => state.context.focused.tasks)

  const changes = useSelector((state) => state.editor.changes)

  const dispatch = useDispatch()

  const newNodes = useSelector((state) => state.editor.new)
  const editorProjectName = useSelector((state) => state.editor.projectName)

  // get attrib fields
  let { data: attribsData = [] } = useGetAttributesQuery()
  //   filter out scopes
  const attribFields = attribsData.filter((a) =>
    a.scope.some((s) => ['folder', 'task'].includes(s)),
  )

  // SEARCH STATES
  // object with folderIds, task parentsIds and taskNames
  const [searchIds, setSearchIds] = useState({})

  // NEW STATES
  const [newEntity, setNewEntity] = useState('')

  // columns widths
  const [columnsWidths, setColumnWidths] = useColumnResize('editor')

  // Hierarchy data is used for fast searching
  const { data: hierarchyData, isLoading: isSearchLoading } = useGetHierarchyQuery(
    { projectName },
    { skip: !projectName },
  )

  // get nodes for tree from redux state
  const rootDataCache = useSelector((state) => state.editor.nodes)

  // used to update nodes
  const [updateEditor, { isLoading: isUpdating }] = useUpdateEditorMutation()

  // set which ids are expanded and loading
  const [loadingBranches, setLoadingBranches] = useState([])
  // use later on for loading new branches
  const [triggerGetExpandedBranch] = useLazyGetExpandedBranchQuery()

  const [triggerGetEntity] = useLazyGetEntityQuery()

  // call loadNewBranches with an array of folder ids to get the branches and patch them into the rootData cache
  const loadNewBranches = async (folderIds, force) => {
    if (!folderIds.length) return

    // get new branches using id
    // if branches are already in cache, then rtk query won't be executed again
    try {
      // get new branches using id
      // get new events data
      setLoadingBranches(folderIds)
      for (const id of folderIds) {
        await triggerGetExpandedBranch(
          {
            projectName,
            parentId: id,
          },
          !force,
        )
      }
      // reset after loading
      setLoadingBranches([])
    } catch (error) {
      console.error(error)
    }
  }

  const inheritableAttribs = useMemo(() => {
    let result = []
    for (const attr of attribsData) {
      if (attr.data.inherit) result.push(attr.name)
    }
    return result
  }, [attribsData])

  // on mount only load root
  // and any other expanded folders
  useEffect(() => {
    let branches = ['root']

    let isNewProject = editorProjectName !== projectName
    if (isNewProject) {
      dispatch(newProject(projectName))
    }

    // load expanded folders from initial context
    if (Object.keys(expandedFolders).length)
      branches = branches.concat(Object.keys(expandedFolders))

    // load initial branches
    console.log('loading initial branches', branches)

    loadNewBranches(branches, isNewProject)
  }, [projectName])

  // get and update children attrib that use it's parents attribs
  const getChildAttribUpdates = (updates) => {
    const childrenUpdated = []
    // create object of updated/new branches
    for (const update of updates) {
      const updateId = update.entityId || update.data.id

      // find all children of patch
      for (const id in rootData) {
        const childData = rootData[id].data

        if (childData?.__parentId === updateId) {
          const newAttrib = {}
          const currentAttrib = childData?.attrib || {}

          // is childData, check ownAttribs for updates
          for (const key in update?.data?.attrib) {
            if (!inheritableAttribs.includes(key)) continue
            if (
              !childData?.ownAttrib?.includes(key) &&
              currentAttrib[key] !== update.data.attrib[key]
            ) {
              newAttrib[key] = update.data.attrib[key]
            }
          }

          if (!isEmpty(newAttrib)) {
            // add new child to updates
            childrenUpdated.push({
              ...rootData[id],
              data: {
                ...childData,
                attrib: { ...currentAttrib, ...newAttrib },
              },
            })
          }
        }
      }
    }

    return childrenUpdated
  }

  // OVERVIEW
  // 1. check entity has been expanded
  // 2. get entity data
  // 3. patch new entity data into editor nodes state
  const handlePubSub = useMemo(
    () =>
      async (topic = '', message) => {
        // check entity changing on current project
        if (!topic.includes('entity')) return
        if (message.project?.toLowerCase() !== projectName.toLowerCase()) return

        const entityId = message.summary.entityId
        const entityType = topic.split('.')[1]

        // check entityId is visible or newly created
        if (!(entityId in rootDataCache) && !topic.includes('created'))
          return console.log('entity not visible yet')

        if (topic.includes('deleted')) {
          // entity has been deleted
          dispatch(nodesUpdated({ deleted: [entityId] }))
          return
        }

        // get entity data
        const res = await triggerGetEntity({ projectName, entityId, entityType }, false)
          .unwrap()
          .catch((err) => {
            console.error(err)
            if (err.status === 404) {
              // entity doesn't exist?
              dispatch(nodesUpdated({ deleted: [entityId] }))
            }
          })

        // creating new nodes on an empty parent
        // we need to make parent expandable
        let parentPatch = []
        const __parentId = res.folderId || res.parentId || 'root'
        if (__parentId in rootData && rootData[__parentId].leaf) {
          parentPatch.push({
            leaf: false,
            data: {
              ...rootData[__parentId]?.data,
              hasChildren: true,
              hasTasks: entityType === 'task',
            },
          })
        }

        console.log('patching in new websocket entityData', res)
        // now patch in new data
        const patch = {
          data: {
            ...res,
            __parentId: __parentId,
            __entityType: entityType,
          },
          leaf: rootDataCache[entityId]?.leaf || true,
        }

        const childUpdates = getChildAttribUpdates([{ data: patch.data }])
        dispatch(nodesUpdated({ updated: [patch, ...childUpdates, ...parentPatch] }))
      },
    [rootDataCache],
  )

  const ids = useMemo(() => Object.keys(rootDataCache), [rootDataCache])

  usePubSub('entity.task', handlePubSub, ids, {
    disableDebounce: true,
    acceptNew: true,
  })
  usePubSub('entity.folder', handlePubSub, ids, {
    disableDebounce: true,
    acceptNew: true,
  })

  //
  // Helpers
  //

  let columns = useMemo(() => getColumns(), [])

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
    })
    return data
  }, [rootDataCache, newNodes, changes, projectName])

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
  }, [rootData, searchIds, projectName])

  const parents = useMemo(() => {
    // This is an auto-generated object in the form of:
    //   { parentId: [child1Id, child2Id....]
    // It is updated when rootData changes and it speeds up
    // building hierarchy

    const result = {}
    for (const childId in filteredNodeData) {
      const parentId = filteredNodeData[childId]?.data?.__parentId
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
  }, [parents, expandedFolders, rootData, projectName])

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
        id: folder.id,
        label: folder.label,
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

  // disable adding new nodes
  const disableAddNew = isEmpty(currentSelection)

  //
  // Commit changes
  //

  const commitNewNodes = (commitChanges, updates, parentPatches) => {
    // Create a map to store the newNodes parentIds.
    const newNodesParentIdsMap = new Map()
    for (const id in newNodes) {
      const parentId = newNodes[id].parentId || newNodes[id].folderId
      newNodesParentIdsMap.set(id, parentId)
    }
    for (const id in newNodes) {
      const entity = newNodes[id]
      const entityType = entity.__entityType
      const newEntity = { ...entity }
      const entityChanges = commitChanges[entity.id]

      // it is a new entity, so only valid attributes are those
      // stored in `changes`. The rest are inherited ones
      let ownAttrib = [...entity.ownAttrib] || []
      const parent = rootData[entity.parentId || entity.folderId]
      // copy over own attrib
      let patchAttrib = { ...entity.attrib } || {}
      // copy over parents if they have any
      if (parent) {
        patchAttrib = { ...parent?.data?.attrib } || {}
      }
      for (const key in entityChanges || {}) {
        if (key.startsWith('__')) continue
        if (key.startsWith('_')) {
          newEntity[key.substring(1)] = entityChanges[key]
        } else {
          if (entityChanges[key]) {
            ownAttrib.push(key)
            patchAttrib[key] = entityChanges[key]
          }
        }
      }

      // check name
      newEntity.name = checkName(newEntity.name)

      // we use a different set of attributes for the newEntity than the patch
      const newEntityAttribs = { ...patchAttrib }
      // remove any attribs that are not ownAttrib
      for (const key in newEntityAttribs) {
        if (!ownAttrib.includes(key)) delete newEntityAttribs[key]
      }
      // add to newEntity
      newEntity.attrib = newEntityAttribs

      const patch = {
        data: {
          ...newEntity,
          name: newEntity.name,
          attrib: patchAttrib,
          ownAttrib,
        },
        leaf: !!entity.leaf || entityType === 'task',
      }

      // if it's a folder, leaf is false
      if (entityType === 'folder') {
        patch.leaf = false
      }

      updates.push({
        id: entity.id,
        entityId: entity.id,
        type: 'create',
        entityType,
        data: newEntity,
        patch,
        depth: entity.depth,
      })

      if (!parent?.data?.hasChildren && entity.__parentId !== 'root' && parent) {
        const parentPatch = {
          data: { ...parent.data, hasTasks: entityType === 'task', hasChildren: true },
          leaf: false,
        }

        // push to array to be added all together later
        parentPatches.push(parentPatch)
      }
    } // CREATE NEW ENTITIES
  }

  const [commitUpdating, setCommitUpdating] = useState(false)

  const handleCommit = async (overrideChanges) => {
    console.time('commit')

    const updates = []
    const parentPatches = []
    const commitChanges = overrideChanges || changes
    // this is when saving only one field
    const forcedSave = !!overrideChanges

    // PATCH / DELETE EXISTING ENTITIES

    const newSelection = { ...currentSelection }

    for (const entityId in commitChanges) {
      // check not changing new node
      if (entityId in newNodes) continue

      const entityType = commitChanges[entityId].__entityType
      const parent =
        rootData[rootData[entityId]?.data?.parentId || rootData[entityId]?.data?.folderId]

      if (commitChanges[entityId].__action === 'delete') {
        updates.push({
          id: entityId,
          type: 'delete',
          entityType,
          entityId,
        })

        // remove from selection
        delete newSelection[entityId]
      } else {
        // End delete, begin patch
        const attribChanges = {}
        const patchAttrib = {}
        const entityChanges = {}
        const ownAttrib = [...rootData[entityId].data.ownAttrib]

        for (const key in commitChanges[entityId]) {
          if (key.startsWith('__')) continue
          if (key.startsWith('_')) {
            if (key === '_name') {
              entityChanges[key.substring(1)] = checkName(commitChanges[entityId][key])
            } else {
              entityChanges[key.substring(1)] = commitChanges[entityId][key]
            }
          } else {
            const change = commitChanges[entityId][key]
            // if value is empty, set to null and use inherited value
            if (!change) {
              attribChanges[key] = null
              // remove from ownAttrib if already there
              const index = ownAttrib.indexOf(key)
              if (index > -1) ownAttrib.splice(index, 1)
              // inherit from parent and add to patchAttrib
              parent?.data?.attrib[key] && (patchAttrib[key] = parent.data.attrib[key])
            } else {
              attribChanges[key] = change
              // add to ownAttrib if not already there
              if (!ownAttrib.includes(key)) ownAttrib.push(key)
              // add to patchAttrib
              patchAttrib[key] = change
            }
          }
        }

        // patch is original data with updated data
        const patch = {
          data: {
            ...rootData[entityId]?.data,
            ...entityChanges,
            attrib: { ...rootData[entityId]?.data?.attrib, ...patchAttrib },
            ownAttrib: ownAttrib,
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

    // skip new nodes if force saving
    if (!forcedSave) {
      // CREATE NEW ENTITIES
      commitNewNodes(commitChanges, updates, parentPatches)
    }

    // validation
    // can't have same name as sibling
    const changesErrors = []
    const errorMessages = []

    // Create a hash table to store the rootData items.
    const rootDataHashTable = new Map()
    for (const id in rootData) {
      rootDataHashTable.set(id, rootData[id])
    }

    // sort updates by depth so lowest comes first
    updates.sort((a, b) => {
      a.depth = a.depth || 0
      b.depth = b.depth || 0
      return a.depth - b.depth
    })

    // Iterate over the updates array.
    for (const op of updates) {
      // Compare the update to the rootData item.
      if (op.type === 'delete') continue

      // Look up the corresponding rootData item by its ID.
      const rootDataItem = rootDataHashTable.get(op.data.__parentId)
      if (!rootDataItem) continue
      const name = op.data.name
      if (name === rootDataItem.name && op.entityId !== rootDataItem.id) {
        // The update and the rootData item have the same name.
        const msg = 'Sibling entities can not have the same name.'
        // ERROR SAME NAME
        changesErrors.push({
          id: op.data.id,
          ...commitChanges[op.entityId],
          errors: {
            _name: msg,
          },
        })
        if (!errorMessages.includes(msg)) errorMessages.push(msg)
      }
    }

    if (errorMessages.length) {
      console.error('ERROR COMMITTING: ', errorMessages)
      toast.warning('Error Committing: ' + errorMessages.toString())
      // update changes to show errors
      dispatch(onNewChanges(changesErrors))
      return
    }

    // split the updates into chunks of 1000
    // to avoid payload too large error
    const chunkedUpdates = []
    const chunkSize = 1000
    for (let i = 0; i < updates.length; i += chunkSize) {
      chunkedUpdates.push(updates.slice(i, i + chunkSize))
    }

    setCommitUpdating(true)
    try {
      for (const updates of chunkedUpdates) {
        const res = await updateEditor({ updates, projectName, rootData }).unwrap()

        if (!res.success) {
          const messages = []
          res.operations.forEach((op) => {
            if (op.success) return
            messages.push(op.detail)
          })
          for (const msg of messages) {
            toast.error('Error: ' + msg)
          }
          setCommitUpdating(false)
          return null
        }
      }
      setCommitUpdating(false)

      // once everything has finished
      toast.success('Changes saved')
      const updated = []
      const deleted = []

      // create object of updated/new branches
      for (const op of updates) {
        if (op.type === 'delete') {
          deleted.push(op.id)
        } else {
          updated.push(op.patch)
        }
      }

      // invalidate these tags ['hierarchy', 'folder', 'task']
      // so that the query will be executed again
      // and the new data will be fetched
      dispatch(ayonApi.util.invalidateTags(['hierarchy', 'folder', 'task']))

      // add new branches to redux editor slice
      dispatch(nodesUpdated({ updated: updated, deleted, forcedSave }))
      if (parentPatches.length) {
        dispatch(nodesUpdated({ updated: parentPatches, forcedSave }))
      }
      // update children
      const childUpdates = getChildAttribUpdates(updates)
      dispatch(nodesUpdated({ updated: childUpdates, forcedSave }))
      // update selection (remove from deleted)
      handleSelectionChange(newSelection)

      return updates
    } catch (error) {
      setCommitUpdating(false)
      toast.error('Unable to save changes')
      console.log(updates)
      console.error(error)
    }
  }

  const onCommit = async (e, overridesChanges) => {
    e?.preventDefault()

    if (Object.keys(changes).length + Object.keys(newNodes).length > 1000) {
      // show warning
      confirmDialog({
        style: { maxWidth: 400 },
        message: `You are about to save ${
          Object.keys(changes).length + Object.keys(newNodes).length
        } changes. This may take a while and freeze the server for everyone else. Are you sure you want to continue?`,
        header: 'Confirm Large Save',
        accept: async () => {
          const res = await handleCommit(overridesChanges)
          return res
          // save
        },
        reject: () => {
          // don't save
          return
        },
      })
    } else {
      handleCommit(overridesChanges)
    }
  }

  const handleForceChange = async (key, value, ids, entityType) => {
    // remove new nodes
    const newNodeIds = ids.filter((id) => id in newNodes)

    if (newNodeIds.length) {
      toast.warn('Unable to quick save new nodes, try saving all')
      return
    }

    const overrideChanges = ids.reduce((acc, id) => {
      acc[id] = {
        __parentId: null,
        __entityType: entityType,
        [key]: value,
      }
      return acc
    }, {})

    const res = await onCommit(undefined, overrideChanges)

    console.log(res)

    // prevent any other changes from being made that would override this one
    throttledEditorChanges.cancel()
    if (res) {
      dispatch(
        onForceChange({
          ids,
          keys: [key],
        }),
      )
    }
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

  const canCommit = !isEmpty(changes) || !isEmpty(newNodes)

  const handleCloseNew = () => {
    setNewEntity('')
  }

  const addNodes = (entityType, root, nodesData = []) => {
    const parents = root ? [null] : futureParents

    // for leaf nodes, add parents to parents
    for (const id of focusedTasks) {
      const parent = rootData[id]?.data?.folderId
      if (!parents.includes(parent)) parents.push(parent)
    }

    if (!parents.length) {
      console.log('Nothing to add')
      return
    }

    // create new nodes objects
    // selecting multiple parents creates a new node for each one
    const addingNewNodes = []
    const folderIds = []
    const taskIds = []
    for (const parentId of parents) {
      let parentData

      // if null (root) parentData is project default attrib
      if (parentId === null) {
        parentData = { attrib }
      } else {
        parentData = rootData[parentId]?.data || {}
      }

      for (const data of nodesData) {
        const newNode = {
          leaf: true,
          name: `new${capitalize(entityType)}${
            Object.values(newNodes).filter((n) => n?.name?.includes(`new${capitalize(entityType)}`))
              .length + parents.indexOf(parentId)
          }`,
          id: uuid1().replace(/-/g, ''),
          status: parentData?.status || 'Not ready',
          attrib: parentData?.attrib || {},
          ownAttrib: [],
          __entityType: entityType,
          __parentId: parentId || 'root',
          __isNew: true,
        }

        const newData = { ...data }

        if (newData.__prefix && parentData.name && parentData.label) {
          // prefix the parent to the name and label
          newData.name = `${parentData.name}${newData.name}`
          newData.label = `${parentData.label}${newData.label}`
        }

        if (entityType === 'folder') {
          newNode['parentId'] = parentId
          newNode['folderType'] = parentData?.folderType
          if (newNode.__parentId === 'root') {
            // all attrib are it's own
            newNode['ownAttrib'] = Object.keys(newNode.attrib)
          }
          folderIds.push(newNode.id)
        } else if (entityType === 'task') {
          newNode['folderId'] = parentId
          newNode['taskType'] = 'Generic'
          taskIds.push(newNode.id)
        }
        addingNewNodes.push({ ...newNode, ...newData })
      }
    }

    // update new nodes state
    dispatch(newNodesAdded(addingNewNodes))

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

      // update selection to new nodes
      const newSelection = {}
      for (const id of folderIds) {
        newSelection[id] = true
      }

      if (!isEmpty(newSelection)) handleSelectionChange(newSelection)
    }
  } // Add node

  //
  // Other user events handlers (Toolbar)
  //

  const onDelete = (sel) => {
    const newIds = Object.keys(newNodes).filter((i) => i in sel)
    const modifiedIds = Object.keys(sel).filter((i) => !newIds.includes(i) && i in sel)

    // remove from newNodes state and the tree table
    dispatch(onRevert(newIds))

    if (newIds.length) {
      // remove newIds from selection
      let newSelection = {}

      if (!modifiedIds.length) {
        // only newIds are being deleted
        // selection will go to first deleted parent
        newSelection = {}
      } else {
        // preserve selection of non newItems
        newSelection = { ...sel }
        for (const id in sel) {
          if (newIds.includes(id)) delete newSelection[id]
        }
      }

      handleSelectionChange(newSelection)
    }

    // for NOT new nodes, add to changes
    // keeps entity in the tree table but shows red strikethrough
    const changes = []

    for (const id of modifiedIds) {
      const currentChanges = changes[id] || {
        id,
        __entityType: rootData[id].data.__entityType,
        __parentId: rootData[id].data.__parentId,
      }
      changes.push({
        ...currentChanges,
        __action: 'delete',
      })
    }

    dispatch(onNewChanges(changes))
  }

  const handleRevert = () => {
    // reset everything
    dispatch(onRevert())

    handleSelectionChange({})
  }

  const revertChangesOnSelection = (currentSelection) =>
    dispatch(onRevert(Object.keys(currentSelection)))

  // CONTEXT MENUS

  // Context menu outside of table items
  const ctxMenuGlobalItems = useMemo(
    () => [
      {
        label: 'Create Folder',
        icon: 'create_new_folder',
        command: () => setNewEntity('folder'),
      },
      {
        label: 'Save All Changes',
        icon: 'check',
        command: onCommit,
        disabled: !canCommit,
        isSave: canCommit,
      },
      {
        label: 'Clear All Changes',
        icon: 'clear',
        command: handleRevert,
        disabled: !canCommit,
      },
    ],
    [canCommit, onCommit, handleRevert],
  )

  const [ctxMenuGlobalShow] = useCreateContext(ctxMenuGlobalItems)

  const getCtxMenuTableItems = (sel) => {
    return [
      {
        label: 'Create Folder',
        icon: 'create_new_folder',
        command: () => setNewEntity('folder'),
      },
      {
        label: 'Create Task',
        icon: 'add_task',
        command: () => setNewEntity('task'),
      },
      {
        label: 'Delete',
        icon: 'delete',
        command: () => onDelete(sel),
        danger: true,
      },
      {
        label: 'Save All Changes',
        icon: 'check',
        command: () => onCommit(),
        disabled: !canCommit,
        isSave: canCommit,
      },
      {
        label: 'Clear Changes',
        icon: 'clear',
        command: () => revertChangesOnSelection(sel),
        disabled: !canCommit,
      },
    ]
  }

  const [ctxMenuTableShow] = useCreateContext([])

  // Context menu

  // When right clicking on the already selected node, we don't want to change the selection
  const onContextMenu = (event) => {
    let selection = currentSelection
    if (event?.node?.key && !(event.node.key in currentSelection)) {
      let newSelection = {
        [event.node.key]: true,
      }

      selection = newSelection

      handleSelectionChange(newSelection)
    }
    ctxMenuTableShow(event.originalEvent, getCtxMenuTableItems(selection))
  }

  //
  // Table event handlers
  //

  const onToggle = async (event) => {
    const isMetaKey = event.originalEvent.metaKey || event.originalEvent.ctrlKey
    const newExpanded = { ...event.value }
    const removedIds = Object.keys(expandedFolders).filter((id) => !(id in newExpanded))

    let newIds = Object.keys(newExpanded)
    // filter out ids that are already in the expandedFolders object
    newIds = newIds.filter((id) => !(id in expandedFolders))

    if (newIds.length && isMetaKey) {
      // find if any of the newIds are in selected folders
      const selected = Object.keys(currentSelection).filter((id) => newIds.includes(id))
      if (selected.length) {
        // we open all selected folders
        newIds = Object.keys(currentSelection)
        // expand all currentSelection folders
        for (const id of newIds) {
          if (rootData[id]?.data.__entityType === 'folder') {
            newExpanded[id] = true
          }
        }
      }
    }

    if (removedIds.length && isMetaKey) {
      // find if any of the newIds are in selected folders
      const selected = Object.keys(currentSelection).filter((id) => removedIds.includes(id))
      if (selected.length) {
        // close all selected folders
        for (const id in currentSelection) {
          if (rootData[id]?.data.__entityType === 'folder') {
            delete newExpanded[id]
          }
        }
      }
    }

    // updated expanded folders context object
    dispatch(setExpandedFolders(newExpanded))

    // load new branches
    loadNewBranches(newIds)
  }

  const handleSelectionChange = (value) => {
    const selection = Object.keys(value)
    // reduce into two arrays, one with type folder and one with type task
    const folders = []
    const tasks = []
    for (const [key, v] of Object.entries(value)) {
      if (rootData[key]?.data.__entityType === 'folder' && v) folders.push(key)
      else if (rootData[key]?.data.__entityType === 'task' && v) tasks.push(key)
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
    }

    if (node?.parents) {
      let uri = `ayon+entity://${projectName}`
      uri += `/${node.parents.join('/')}/${node.name}`
      if (event.node.data.__entityType === 'task') {
        uri += `?task=${event.node?.data?.name}`
      }
      dispatch(setUri(uri))
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

  const handleDeselect = (e) => {
    // target class is p-treetable-scrollable-body
    if (e.target.classList.contains('p-treetable-scrollable-body')) {
      handleSelectionChange({})
    }
  }

  let allColumns = useMemo(
    () => [
      <Column
        field="name"
        key="name"
        header="Name"
        expander={true}
        body={(rowData) => (
          <NameField
            node={rowData.data}
            changes={changes}
            styled
            tasks={tasks}
            folders={foldersObject}
          />
        )}
        style={{ width: columnsWidths['name'] || 230, height: 33 }}
        sortable
      />,
      <Column
        field="type"
        key="type"
        header="Type"
        body={(rowData) => formatType(rowData.data, changes)}
        style={{ width: columnsWidths['type'] || 140 }}
      />,
      ...columns.map((col) => (
        <Column
          key={col.name}
          header={col.title}
          field={col.name}
          style={{ width: columnsWidths[col.name] || 140 }}
          body={(rowData) => formatAttribute(rowData.data, changes, col.name)}
        />
      )),
    ],
    [rootData],
  )

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

  // filter nodes that are undefined for editor
  const editorNodes = {}
  // filter out undefined nodes
  for (const id in currentSelection) {
    if (currentSelection[id] && !isEmpty(currentSelection[id])) {
      editorNodes[id] = currentSelection[id]
    }
  }

  // only updates global changes every 500ms trailing to limit expensive tree table rerenders
  // keeps editor form fast
  const throttledEditorChanges = debounce((c) => dispatch(onNewChanges(c)), 500)

  const fullPageLoading = loadingBranches.includes('root')
  // loading
  if (fullPageLoading) {
    // when replace all data with dummy data
    // 10 folders
    treeData = Array.from({ length: 10 }, (_, i) => ({
      key: i,
      data: {},
      children: [],
      leaf: true,
    }))
  }

  function addDummyChildren(branch, localBranchesLoading) {
    const newBranch = { ...branch }
    if (localBranchesLoading.includes(branch.key)) {
      newBranch.children = Array.from({ length: 1 }, (_, i) => ({
        key: i,
        data: {},
        children: [],
        leaf: true,
        className: 'loading',
      }))
    } else if (branch.children) {
      newBranch.children = branch.children.map((child) =>
        addDummyChildren(child, localBranchesLoading),
      )
    }
    return newBranch
  }

  // when loading a new branch
  // when add dummy children to the branch
  const localBranchesLoading = loadingBranches.filter((b) => b !== 'root')

  if (localBranchesLoading.length) {
    // in treeData, find the branch that is loading by id
    // branches can have children so we need to check those too
    // if the branch is found, add dummy children to it

    const loadingTreeData = treeData.map((branch) => addDummyChildren(branch, localBranchesLoading))

    // replace treeData with loadingTreeData
    treeData = loadingTreeData
  }

  const shortcuts = [
    {
      key: 'n',
      action: () => setNewEntity('folder'),
    },
    {
      key: 'm',
      action: () => setNewEntity('sequence'),
    },
    {
      key: 't',
      action: () => setNewEntity('task'),
      disabled: disableAddNew,
    },
  ]

  useShortcuts(shortcuts, [disableAddNew])

  //
  // Render the TreeTable

  return (
    <main className="editor-page">
      {newEntity &&
        (newEntity === 'sequence' ? (
          <NewSequence
            visible={newEntity === 'sequence'}
            onHide={() => setNewEntity('')}
            onConfirm={addNodes}
            currentSelection={currentSelection}
          />
        ) : (
          <NewEntity
            type={newEntity}
            visible={!!newEntity}
            onHide={handleCloseNew}
            onConfirm={addNodes}
            currentSelection={currentSelection}
          />
        ))}
      <Section>
        <Toolbar>
          <Button
            icon="create_new_folder"
            label="Add folders"
            onClick={() => setNewEntity('folder')}
            title='Press "n" to create folders'
          />
          <Button
            icon="topic"
            label="Add folder sequence"
            onClick={() => setNewEntity('sequence')}
            title='Press "m" to create a folder sequence'
          />
          <Button
            icon="add_task"
            label="Add tasks"
            disabled={disableAddNew}
            onClick={() => setNewEntity('task')}
            title='Press "t" to create tasks'
          />
          <BuildHierarchyButton disabled={!focusedFolders.length && focusedTasks.length} />
          <MultiSelect
            options={filterOptions}
            value={shownColumns}
            onChange={handleColumnsFilter}
            placeholder={`Show Columns`}
            fixedPlaceholder={shownColumns.length >= filterOptions.length}
            style={{ maxWidth: 200 }}
          />
          <SearchDropdown
            filter={searchFilter}
            suggestions={searchableFolders}
            suggestionsLimit={5}
            onSubmit={handleSearchComplete}
            onClear={() => searchIds && setSearchIds({})}
            isLoading={isSearchLoading}
          />
          <Spacer />
          {canCommit && <>Unsaved Changes</>}
          <Button
            icon="clear"
            label="Clear All Changes"
            onClick={handleRevert}
            disabled={!canCommit}
          />
          <SaveButton
            label="Save Changes"
            onClick={onCommit}
            active={canCommit}
            saving={commitUpdating}
          />
        </Toolbar>
        <Splitter
          style={{ width: '100%', height: '100%' }}
          layout="horizontal"
          stateKey="editor-panels"
          stateStorage="local"
        >
          <SplitterPanel size={70} id="global" onContextMenu={ctxMenuGlobalShow}>
            <TablePanel loading={isUpdating} style={{ height: '100%' }}>
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
                onSelectionChange={(e) => handleSelectionChange(e.value)}
                onClick={handleDeselect}
                onRowClick={onRowClick}
                rowClassName={(rowData) => {
                  return {
                    changed: rowData.key in changes,
                    new: rowData.key in newNodes,
                    deleted: rowData.key in changes && changes[rowData.key]?.__action == 'delete',
                  }
                }}
                onContextMenu={onContextMenu}
                onColumnResizeEnd={setColumnWidths}
                reorderableColumns
                onColReorder={handleColumnReorder}
                rows={20}
                className={fullPageLoading ? 'table-loading' : undefined}
              >
                {allColumns}
              </TreeTable>
            </TablePanel>
          </SplitterPanel>
          <SplitterPanel size={30} minSize={30}>
            <EditorPanel
              editorMode
              nodes={editorNodes}
              onChange={(c) => throttledEditorChanges(c)}
              onDelete={() => onDelete(currentSelection)}
              onRevert={() => revertChangesOnSelection(currentSelection)}
              attribs={attribFields}
              projectName={projectName}
              onForceChange={handleForceChange}
            />
          </SplitterPanel>
        </Splitter>
      </Section>
    </main>
  )
}

export default EditorPage
