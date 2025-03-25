import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
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

import { sortByLabelAndName } from '@helpers/sortByHelpers'

import { editorSelectionChanged, setUri, setExpandedFolders } from '@state/context'

import { getColumns, formatType, formatAttribute, formatAssignees, formatStatus } from './utils'
import { MultiSelect } from 'primereact/multiselect'
import useLocalStorage from '@hooks/useLocalStorage'
import { useGetFolderHierarchyQuery } from '@queries/getHierarchy'
import SearchDropdown from '@components/SearchDropdown/SearchDropdown'
import useColumnResize from '@hooks/useColumnResize'
import { capitalize, debounce, isEmpty } from 'lodash'
import { useLazyGetExpandedBranchQuery } from '@queries/editor/getEditor'
import { useUpdateEditorMutation } from '@queries/editor/updateEditor'
import usePubSub from '@hooks/usePubSub'
import { useLazyGetEntityQuery } from '@queries/entity/getEntity'
import {
  newNodesAdded,
  newProject,
  nodesUpdated,
  onForceChange,
  onNewChanges,
  onRevert,
} from '@state/editor'
import EditorPanel from './EditorPanel/EditorPanel'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import NameField from './fields/NameField'
import { useGetAttributeListQuery } from '@queries/attributes/getAttributes'
import NewEntity from './NewEntity'
import checkName from '@helpers/checkName'
import useCreateContext from '@hooks/useCreateContext'
import api from '@api'
import { confirmDialog } from 'primereact/confirmdialog'
import BuildHierarchyButton from '@containers/HierarchyBuilder'
import NewSequence from './NewSequence'
import { useGetUsersAssigneeQuery } from '@queries/user/getUsers'
import confirmDelete from '@helpers/confirmDelete'
import { useGetProjectAnatomyQuery } from '@queries/project/getProject'
import Shortcuts from '@containers/Shortcuts'
import useTableKeyboardNavigation, {
  extractIdFromClassList,
} from '@containers/Feed/hooks/useTableKeyboardNavigation'
import clsx from 'clsx'

const EditorPage = () => {
  const project = useSelector((state) => state.project)
  const { folders: foldersObject, tasks = [], attrib, statusesOrder = [] } = project

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
  // pass editor: true so that it uses different cache.
  let { data: attribsData = [] } = useGetAttributeListQuery({}, { refetchOnMountOrArgChange: true })

  // get project attribs values (for root inherited attribs)
  const { data: projectAnatomyData } = useGetProjectAnatomyQuery(
    { projectName },
    { skip: !projectName },
  )

  //   filter out scopes
  const attribFields = attribsData.filter((a) =>
    a.scope.some((s) => ['folder', 'task'].includes(s)),
  )

  // these attributes are not inherited when creating new nodes
  const attribsNotInherited = attribFields.filter((a) => !a.data?.inherit).map((a) => a.name)

  const pageFocusRef = useRef(null)

  // SEARCH STATES
  // object with folderIds, task parentsIds and taskNames
  const [searchIds, setSearchIds] = useState({})

  // NEW STATES
  const [newEntity, setNewEntity] = useState('')

  // columns widths
  const [columnsWidths, setColumnWidths] = useColumnResize('editor')

  // Hierarchy data is used for fast searching
  const { data: hierarchyResponse = {}, isLoading: isSearchLoading } = useGetFolderHierarchyQuery(
    { projectName },
    { skip: !projectName },
  )

  const hierarchyData = hierarchyResponse.hierarchy || []

  const { data: allUsers = [] } = useGetUsersAssigneeQuery({ names: undefined, projectName })

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

  // Function to get and update children attributes that use their parent's attributes
  const getChildAttribUpdates = (updates) => {
    // Array to store the updated children
    const childrenUpdated = []

    // Loop through each update
    for (const update of updates) {
      // Get the ID of the entity being updated
      const updateId = update.entityId || update.data.id

      // Create a lookup table to store the children of each parent
      const childrenLookup = {}

      // Loop through each entity in the root data
      for (const id in rootData) {
        // Get the parent ID of the current entity
        const parentId = rootData[id].data.__parentId

        // If the entity has a parent
        if (parentId) {
          // If the parent doesn't exist in the lookup table, add it
          if (!childrenLookup[parentId]) {
            childrenLookup[parentId] = []
          }

          // Add the current entity to the parent's list of children in the lookup table
          childrenLookup[parentId].push(id)
        }
      }

      // Function to update the attributes of the children
      const updateChildren = (updateId, parent, skipAttribs = []) => {
        // Get the children of the entity being updated from the lookup table
        const children = childrenLookup[updateId]

        // If the entity has children
        if (children) {
          // Loop through each child
          for (const id of children) {
            // Get the data of the current child
            const childData = rootData[id].data

            // Object to store the new attributes
            const newAttrib = {}

            // Get the current attributes of the child
            const currentAttrib = childData?.attrib || {}

            const childSkipAttribs = []
            const parentData = parent || update?.patch?.data
            const childChanges = changes[id]
            let newChildData = { ...childData }

            // Loop through each attribute in the update
            for (const key in parentData.attrib) {
              // If the attribute is not inheritable, skip it
              if (!inheritableAttribs.includes(key)) continue

              // check that child doesn't have it's own changes for this attrib
              // if it does, then we don't need to update it
              if (childChanges && childChanges[key]) {
                // now any children of this child should use this value
                newChildData = {
                  ...childData,
                  ownAttrib: [...childData.ownAttrib, key],
                  attrib: { ...childData.attrib, [key]: childChanges[key] },
                }

                continue
              }

              // If the child doesn't have its own value for the attribute and the attribute has changed
              if (
                !childData?.ownAttrib?.includes(key) &&
                currentAttrib[key] !== parentData.attrib[key]
              ) {
                if (parent) {
                  // check if parent of this (not parent we just edited) has the same attribute in ownAttrib
                  if (parent?.ownAttrib?.includes(key) || skipAttribs.includes(key)) {
                    // it's parent has the attrib, so we don't need to update this child
                    // we can also skip this child's children
                    childSkipAttribs.push(key)

                    // break out of the loop so that we don't update the attribute
                    continue
                  }
                }
                // Add the new attribute value to the new attributes object
                newAttrib[key] = parentData?.attrib[key]
              }
            }

            // If there are new attributes
            if (!isEmpty(newAttrib) || !isEmpty(childChanges || {})) {
              // Update the child's attributes
              newChildData = {
                ...newChildData,
                attrib: { ...newChildData.attrib, ...(newAttrib || {}) },
              }

              // Add the updated child to the list of updated children
              childrenUpdated.push({
                ...rootData[id],
                data: newChildData,
              })
            }

            // Recursively update the attributes of the child's children
            updateChildren(id, newChildData, childSkipAttribs)
          }
        }
      }

      // Update the attributes of the entity's children
      updateChildren(updateId)
    }

    // Return the list of updated children
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
  // are needed for the hierarchy, so this cascading makes
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
          data: {
            ...rootData[childId].data,
            labelThenName: rootData[childId].data.label || rootData[childId].data.name,
          },
          leaf: rootData[childId].leaf,
        }
        if (!node.leaf) {
          node.children = []
          if (childId in expandedFolders) buildHierarchy(childId, node.children)
          // sort children by name
          node.children = sortByLabelAndName(node.children)
        }
        target.push(node)
      }
    }

    buildHierarchy('root', result)
    return sortByLabelAndName(result)
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
      folder.keywords.some((key) => key.toLowerCase().includes(search.toLowerCase())),
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

  const commitNewNodes = (commitChanges, updates) => {
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

        // remove any non-inherited attribs
        for (const key of attribsNotInherited) {
          delete patchAttrib[key]
        }
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
    } // CREATE NEW ENTITIES
  }

  // all the invalidations and patches after a commit is successful
  const onCommitSuccess = async (
    updates = [],
    parentPatches = [],
    newSelection,
    forcedSave = false,
  ) => {
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
        const patch = { ...op.patch }
        // delete: __isNew
        delete patch.data.__isNew
        updated.push(patch)
      }
    }

    // invalidate these tags ['hierarchy', 'folder', 'task']
    // so that the query will be executed again
    // and the new data will be fetched
    dispatch(
      api.util.invalidateTags(['hierarchy', 'folder', 'task', { type: 'kanBanTask', id: 'LIST' }]),
    )

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
  }

  const [commitUpdating, setCommitUpdating] = useState(false)

  const handleCommit = async (overrideChanges) => {
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
          // force: true # TODO toggleable for managers
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
              if (parent?.data?.attrib[key]) patchAttrib[key] = parent.data.attrib[key]
              else {
                // no parent? it must be root. We need to inherit from project
                const attribs = projectAnatomyData?.attributes
                const attrib = attribs[key]
                patchAttrib[key] = attrib || null
              }
            } else {
              attribChanges[key] = change
              // add to ownAttrib if not already there
              if (!ownAttrib.includes(key)) ownAttrib.push(key)
              // add to patchAttrib
              patchAttrib[key] = change
            }
          }
        }

        const parentAttrib = { ...(rootData[entityId]?.data?.attrib || {}) }

        // remove any non-inherited attribs
        for (const key of attribsNotInherited) {
          delete parentAttrib[key]
        }

        // add attribsNotInherited to patchAttrib (if not already in patch)
        for (const key of attribsNotInherited) {
          const nodeAttribs = rootData[entityId]?.data?.attrib || {}
          if (!patchAttrib[key] && nodeAttribs[key]) {
            patchAttrib[key] = nodeAttribs[key]
          }
        }

        // patch is original data with updated data
        const patch = {
          data: {
            ...rootData[entityId]?.data,
            ...entityChanges,
            attrib: { ...parentAttrib, ...patchAttrib },
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

          // if the error is a 409, then ask the user if they want to override
          if (res?.operations?.some((op) => op.errorCode === 'delete-folder-with-children')) {
            confirmDelete({
              style: { maxWidth: 400 },
              message:
                'Are you sure you want to permanently delete this folder and all its associated tasks, products, versions, representations, and workfiles?',
              header: 'Confirm Force Delete',
              deleteLabel: 'Force Delete',
              showToasts: false,
              accept: async () => {
                // assign force flag to updates now
                // we need to save all updates again
                const forcedUpdates = updates.map((op) => ({ ...op, force: true }))

                const res2 = await updateEditor({
                  updates: forcedUpdates,
                  projectName,
                  rootData,
                }).unwrap()

                if (!res2.success) {
                  for (const msg of messages) {
                    toast.error('Error: ' + msg)
                  }
                  setCommitUpdating(false)
                  return null
                } else {
                  // continue with patching etc
                  onCommitSuccess(updates, parentPatches, newSelection, forcedSave)
                }
              },
              reject: () => {
                // don't save anything
                setCommitUpdating(false)
                return
              },
            })

            return
          } else {
            for (const op of res.operations) {
              if (op.errorCode === 'unique-violation') {
                toast.error('Error: Duplicate name found in sibling entities')
              } else {
                toast.error('Error: ' + op.detail)
              }
            }
            setCommitUpdating(false)
            return null
          }
        }
      }

      onCommitSuccess(updates, parentPatches, newSelection, forcedSave)
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

    const currentFocusEl = pageFocusRef.current
    if (currentFocusEl) {
      currentFocusEl.focus()
    }
  }

  const addNodes = (entityType, root, nodesData = [], sequence) => {
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
        const parentAttrib = { ...(parentData?.attrib || {}) }

        // remove any non-inherited attribs
        for (const key of attribsNotInherited) {
          delete parentAttrib[key]
        }

        const newNode = {
          leaf: true,
          name: `new${capitalize(entityType)}${
            Object.values(newNodes).filter((n) => n?.name?.includes(`new${capitalize(entityType)}`))
              .length + parents.indexOf(parentId)
          }`,
          id: uuid1().replace(/-/g, ''),
          status: parentData?.status || statusesOrder[0] || undefined,
          attrib: parentAttrib,
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
      let count = 0
      for (const id of parents) {
        if (count >= 1) break // exit loop after first two items
        exps[id] = true
        if (rootData[id]?.data?.hasChildren) {
          loadBranches.push(id)
        }
        count++
      }
      dispatch(setExpandedFolders(exps))
      // get new branch
      loadNewBranches(loadBranches)

      // only auto select for sequences
      if (sequence) {
        // update selection to new nodes
        const newSelection = {}
        for (const id of folderIds) {
          newSelection[id] = true
        }

        if (!isEmpty(newSelection)) handleSelectionChange(newSelection)
      }
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
        label: 'Add Folders',
        icon: 'create_new_folder',
        command: () => setNewEntity('folder'),
      },
    ],
    [],
  )

  const [ctxMenuGlobalShow] = useCreateContext(ctxMenuGlobalItems)

  const getCtxMenuTableItems = (sel) => {
    return [
      {
        label: 'Add Folders',
        icon: 'create_new_folder',
        shortcut: 'N',
        command: () => setNewEntity('folder'),
      },
      {
        label: 'Add Tasks',
        icon: 'add_task',
        shortcut: 'T',
        command: () => setNewEntity('task'),
      },
      {
        label: 'Clear Changes',
        icon: 'clear',
        command: () => revertChangesOnSelection(sel),
        disabled: !canCommit,
      },
      {
        label: 'Delete',
        icon: 'delete',
        command: () => onDelete(sel),
        danger: true,
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

  const handleToggleFolder = useCallback(
    async (e, dc, meta) => {
      // for double click, check target isn't the expand button

      // double click is different to handleToggleFolder. handleToggleFolder required originalEvent
      const event = e.originalEvent || e
      const target = event?.target

      if (dc && target?.closest('p-treetable-toggler')) return

      const isMeta = event.metaKey || event.ctrlKey || meta

      let id
      // id of the folder that was toggled
      const classList = target?.closest('tr')?.classList
      if (classList) {
        id = Array.from(classList)
          .filter((c) => c.startsWith('id-'))[0]
          .split('-')[1]
      }

      if (!id) return

      const newExpanded = { ...expandedFolders }
      const getNewBranches = []
      // is the folder toggled in the selection
      const isToggledFolderInMultipleSel =
        !!currentSelection[id] && Object.keys(currentSelection).length > 1

      // check if the folder is already expanded
      const isExpanded = !!expandedFolders[id]

      // 2. collapse all children

      if (isExpanded) {
        // keep track of closing parents
        // so we can close any children of the closing parent (if meta)
        const closingParents = []
        if (isMeta && isToggledFolderInMultipleSel) {
          // remove all selected
          const newSelection = { ...currentSelection }
          for (const key in newSelection) {
            if (rootData[key]?.data.__entityType === 'folder') {
              closingParents.push(key)
              delete newExpanded[key]
            }
          }
        } else {
          closingParents.push(id)
          // remove from expandedFolders
          delete newExpanded[id]
        }

        // close any children of the closing parents
        if (isMeta) {
          // for the remaining expanded folders, check if they are children of the closing parents
          let queue = [...closingParents]
          while (queue.length > 0) {
            const id = queue.shift()
            if (newExpanded[id]) {
              delete newExpanded[id]
            }
            for (const childId in rootData) {
              if (rootData[childId]?.data.__parentId === id) {
                queue.push(childId)
              }
            }
          }
        }
      } else {
        if (isMeta && isToggledFolderInMultipleSel) {
          // check if there are any other folders selected that are not already expanded (multiple expand)
          const newSelection = { ...currentSelection }
          const selectedFolders = Object.keys(newSelection).filter(
            (k) => newSelection[k].data.__entityType === 'folder',
          )

          const newExpandedFolders = selectedFolders.filter((f) => !expandedFolders[f])

          for (const folder of newExpandedFolders) {
            newExpanded[folder] = true
            // get new branch
            getNewBranches.push(folder)
          }
        } else {
          // add to expandedFolders
          newExpanded[id] = true
          // get new branch
          getNewBranches.push(id)

          if (isMeta) {
            // expand all children to id and also id

            // because we don't know the children folders until the parent is expanded
            // we need to use hierarchy to get all the children of the parent
            // searchable folders is a flat list of all folders and tasks

            const hierarchyParent = searchableFolders.find((f) => f.id === id)

            if (hierarchyParent) {
              // loop over it's children and add to expandedFolders
              const queue = [hierarchyParent]
              while (queue.length > 0) {
                const folder = queue.shift()
                newExpanded[folder.id] = true
                getNewBranches.push(folder.id)
                if (folder.children?.length) {
                  queue.push(...folder.children)
                }
              }
            }
          }
        }
      }

      // updated expanded folders context object
      dispatch(setExpandedFolders(newExpanded))

      // load new branches
      loadNewBranches(getNewBranches)
    },
    [currentSelection, expandedFolders, rootData, loadNewBranches, dispatch],
  )

  const updateURI = (e) => {
    // get id
    const id = extractIdFromClassList(e.target.classList)

    if (!id) return

    const node = rootData[id]?.data

    if (!node) return
    //
    let endFolder
    if (node.__entityType === 'folder') {
      endFolder = node
    } else if (node.__entityType === 'task') {
      // find the parent folder
      endFolder = searchableFoldersSet.get(node.__parentId)

      if (!endFolder) {
        // the parent could be a new node, so look in newNodes
        endFolder = newNodes[node.__parentId]
      }
    }

    const parents = endFolder?.parents || []

    if (!parents?.length && endFolder?.parentId) {
      // get any parents of that parent and add
      let parentNode = searchableFoldersSet.get(endFolder.parentId)

      // parent node could be a new node
      if (!parentNode) parentNode = newNodes[endFolder.parentId]
      if (parentNode) parents.push(parentNode.name)
      if (parentNode?.parents?.length) {
        parents.push(...parentNode.parents)
      } else if (parentNode.__isNew) {
        // we need to recursively find parents until we find a parent that is not new
        const getParents = (node) => {
          const parent = newNodes[node.parentId] || searchableFoldersSet.get(node.parentId)
          if (parent) {
            if (parent.__isNew) {
              parents.unshift(parent.name)
              getParents(parent)
            } else {
              parents.unshift(parent.name)
            }
          }
        }

        getParents(parentNode)
      }
    }

    const pathNames = [...parents, endFolder.name]

    if (pathNames.length) {
      let uri = `ayon+entity://${projectName}`
      uri += `/${pathNames.join('/')}`
      if (node.__entityType === 'task') {
        uri += `?task=${node.name}`
      }
      dispatch(setUri(uri))
    }
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

  const columnFilterOptions = [
    { name: 'name', title: 'Name' },
    { name: 'type', title: 'Type' },
    { name: 'status', title: 'Status' },
    { name: 'assignees', title: 'Assignees' },
    ...columns,
  ].map(({ name, title }) => ({
    value: name,
    label: title || name,
  }))
  const allColumnsNames = columnFilterOptions.map(({ value }) => value)

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

  const tableRef = useRef(null)

  const handleTableKeyDown = useTableKeyboardNavigation({
    tableRef,
    treeData,
    selection: currentSelection,
    onSelectionChange: ({ object }) => handleSelectionChange(object),
  })

  const handleDoubleClick = (e) => {
    // check if type-folder
    const isFolder = e.target.closest('tr.type-folder')
    if (isFolder) handleToggleFolder(e, true)
  }

  let allColumns = useMemo(
    () => [
      <Column
        field="labelThenName"
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
      <Column
        field="status"
        key="status"
        header="Status"
        body={(rowData) => formatStatus(rowData.data, changes, columnsWidths['status'] || 140)}
        style={{ width: columnsWidths['status'] || 140 }}
      />,
      <Column
        field="assignees"
        key="assignees"
        header="Assignees"
        body={(rowData) => formatAssignees(rowData.data, changes, allUsers)}
        style={{ width: columnsWidths['assignees'] || 140 }}
      />,
      ...columns.map((col) => (
        <Column
          key={col.name}
          header={col.title}
          field={col.name}
          style={{ width: columnsWidths[col.name] || 140 }}
          body={(rowData) => formatAttribute(rowData?.data, changes, col.name)}
        />
      )),
    ],
    [rootData, columnsWidths],
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
    allColumns = allColumns.filter(({ key }) => shownColumns.includes(key))
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
      isLoading: true,
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
        isLoading: true,
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
    {
      key: 'c',
      action: (e) => handleToggleFolder(e, true),
      closest: 'tr.type-folder',
    },
  ]

  //
  // Render the TreeTable

  return (
    <main className="editor-page">
      <Shortcuts shortcuts={shortcuts} deps={[disableAddNew, handleToggleFolder]} />
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
      <Section onFocus={(e) => (pageFocusRef.current = e.target)}>
        <Toolbar>
          <Button
            icon="create_new_folder"
            label="Add folders"
            onClick={() => setNewEntity('folder')}
            data-tooltip="Add new folders"
            data-shortcut="N"
          />
          <Button
            icon="topic"
            label="Add folder sequence"
            onClick={() => setNewEntity('sequence')}
            data-tooltip="Add new folder sequence"
            data-shortcut="M"
          />
          <Button
            icon="add_task"
            label="Add tasks"
            disabled={disableAddNew}
            onClick={() => setNewEntity('task')}
            data-tooltip="Add new tasks"
            data-shortcut="T"
          />
          <BuildHierarchyButton disabled={!focusedFolders.length && focusedTasks.length} />
          <MultiSelect
            options={columnFilterOptions}
            value={shownColumns}
            onChange={handleColumnsFilter}
            placeholder={`Show Columns`}
            fixedPlaceholder={shownColumns.length >= columnFilterOptions.length}
            style={{ maxWidth: 200 }}
          />
          <SearchDropdown
            suggestions={searchableFolders}
            suggestionsLimit={5}
            isLoading={isSearchLoading}
            placeholder="Filter folders & tasks..."
            filter={searchFilter}
            onSubmit={handleSearchComplete}
            onClear={() => searchIds && setSearchIds({})}
          />
          <Spacer />
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
                onToggle={handleToggleFolder}
                selectionMode="multiple"
                selectionKeys={currentSelection}
                rowClassName={(rowData) => {
                  return {
                    changed: rowData.key in changes,
                    new: rowData.key in newNodes,
                    deleted: rowData.key in changes && changes[rowData.key]?.__action == 'delete',
                    ['id-' + rowData.key]: true,
                    ['type-' + rowData.data.__entityType]: true,
                    compact: true,
                    loading: rowData.isLoading,
                  }
                }}
                onContextMenu={onContextMenu}
                onColumnResizeEnd={setColumnWidths}
                reorderableColumns
                onColReorder={handleColumnReorder}
                rows={20}
                className={clsx({ loading: fullPageLoading })}
                ref={tableRef}
                onSelectionChange={(e) => handleSelectionChange(e.value)}
                pt={{
                  root: {
                    onKeyDown: handleTableKeyDown,
                    onFocus: updateURI,
                    onClick: handleDeselect,
                    onDoubleClick: handleDoubleClick,
                  },
                }}
              >
                {allColumns}
              </TreeTable>
            </TablePanel>
          </SplitterPanel>
          <SplitterPanel size={30} minSize={30}>
            <EditorPanel
              editorMode
              parentEditorNodes={editorNodes}
              onChange={(c) => throttledEditorChanges(c)}
              onDelete={() => onDelete(currentSelection)}
              onRevert={() => revertChangesOnSelection(currentSelection)}
              attribs={attribFields}
              projectName={projectName}
              onForceChange={handleForceChange}
              allUsers={allUsers}
            />
          </SplitterPanel>
        </Splitter>
      </Section>
    </main>
  )
}

export default EditorPage
