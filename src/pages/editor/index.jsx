import axios from 'axios'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'
import { InputSwitch } from 'primereact/inputswitch'
import { Shade, Spacer, Button } from '/src/components'

import { 
  isEmpty, 
  sortByKey, 
} from '/src/utils'

import {
  setBreadcrumbs,
  setExpandedFolders,
  setFocusedFolders,
} from '/src/features/context'

import { buildQuery } from './queries'
import { getColumns, formatName, formatType, formatAttribute } from './utils'
import { stringEditor, typeEditor } from './editors'
import { loadBranch, getUpdatedNodeData} from './loader'


const EditorPage = () => {
  const [loading, setLoading] = useState(false)

  const context = useSelector((state) => ({ ...state.context }))
  const settings = useSelector((state) => ({ ...state.settings }))
  const projectName = context.projectName
  const dispatch = useDispatch()

  const [nodeData, setNodeData] = useState({})
  const [changes, setChanges] = useState({})
  const [newNodes, setNewNodes] = useState([])
  const [selectionLocked, setSelectionLocked] = useState(false)


  const currentSelection = useMemo(() => {
    // This object holds the information on current selected nodes.
    // It has the same structure as nodeData, e.g. {objecId: nodeData, ...}
    // so it is compatible with the treetable selection argument and it 
    // also provides complete node information
    const result = {}
    for (const key of context.focusedFolders)
      result[key] = nodeData[key]
    for (const key of context.focusedTasks)
      result[key] = nodeData[key]
    return result
  }, [context.focusedFolders, context.focusedTasks, nodeData])

  //
  // Helpers
  //

  const columns = useMemo(
    () => getColumns(settings.attributes),
    [settings.attributes]
  )
  const query = useMemo(
    () => buildQuery(settings.attributes),
    [settings.attributes]
  )


  useEffect(() => {
    setLoading(true)
    const expandedKeys = [...Object.keys(context.expandedFolders), 'root']
    getUpdatedNodeData(nodeData, newNodes, expandedKeys, parents, query, projectName).then((result) => {
      setNodeData(result)
      setLoading(false)
    })
  }, [context.expandedFolders, newNodes])

  //
  // Build hierarchy
  //

  const parents = useMemo(() => {
    // This is an auto-generated object in the form of:
    //   { parentId: [child1Id, child2Id....]
    // It is updated when nodeData changes and it speeds up
    // building hierarchy

    const result = {}
    for (const childId in nodeData) {
      const parentId = nodeData[childId].data.__parentId
      if (!(parentId in result)) result[parentId] = []
      result[parentId].push(childId)
    }
    return result
  }, [nodeData])

  // Build hierarchical data for the TreeTable component
  // Trigger the rebuild when parents are updated (which are
  // updated after nodeData update. Both nodeData and parents
  // are needed for the hierarchy, so thi cascading makes
  // it possible)

  const treeData = useMemo(() => {
    if (isEmpty(parents)) {
      return []
    }
    const result = []

    const buildHierarchy = (parentId, target) => {
      if (!parents[parentId]) return
      for (const childId of parents[parentId]) {
        const node = {
          key: childId,
          name: nodeData[childId].data.name,
          data: nodeData[childId].data,
          leaf: nodeData[childId].leaf,
        }
        if (!node.leaf) {
          node.children = []
          if (childId in context.expandedFolders)
            buildHierarchy(childId, node.children)
        }
        target.push(node)
      }
    }

    buildHierarchy('root', result)
    return sortByKey(result, 'name')
  }, [parents])

  /*
    *
  TODO: remove if not needed (probably it isn't)

  // Handle selection change.
  // This also accept the selection from the project context, so
  // when the selection is made in the browser page, it is propagated to the editor too
  // (but only the last focused folder, since editor does not support multiselect for
  // various reasons)

  useEffect(() => {
    const nodeId =
      context.focusedFolders.length &&
      context.focusedFolders[context.focusedFolders.length - 1]
    if (!nodeId) {
      return
    }
    const node = nodeData[nodeId]?.data
    if (!node) return
    if (node.__entityType === 'folder') {
      dispatch(
        setBreadcrumbs({
          parents: node.parents,
          folder: node.name,
        })
      )
    }
  }, [context.focusedFolders, treeData])

  */

  //
  // Update handlers
  //

  const updateAttribute = (options, value) => {
    setChanges((changes) => {
      for (const id in currentSelection){
        changes[id] = changes[id] || {
          __entityType: nodeData[id].data.__entityType,
          __parentId: nodeData[id].data.__parentId,
        }
        changes[id][options.field] = value
      }
      return changes
    })

    // Force table render when selection is locked
    if (selectionLocked)
      dispatch(setFocusedFolders(context.focusedFolders))
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
    const key = options.rowData.__entityType === "folder" ? "_folderType" : "_taskType"
    rowChanges[key] = value
    setChanges((changes) => {
      return { ...changes, [id]: rowChanges }
    })
  }

  //
  // Commit changes
  //


  const getBranchesToReload = (entityId) => {
    let result = [entityId]
    if (!parents[entityId]) return result
    for (const chId of parents[entityId]) {
      if (chId in parents) result = [...result, ...getBranchesToReload(chId)]
    }
    return result
  }

  const onCommit = useCallback(async () => {
    setLoading(true)
    let branchesToReload = []
    let deleted = []
    let updated = []
    let created = []

    //
    // PATCH / DELETE EXISTING ENTITIES
    //

    for (const entityId in changes) {
      if (entityId.startsWith('newnode')) continue

      const entityType = changes[entityId].__entityType
      const parentId = changes[entityId].__parentId

      if (changes[entityId].__action === "delete"){
        try {
          await axios.delete(
            `/api/projects/${projectName}/${entityType}s/${entityId}`
          )
          deleted.push(entityId)
        } catch {
          toast.error(`Unable to delete entity`) // TODO: be decriptive
        }

      } else { // End delete, begin patch
        const attribChanges = {}
        const entityChanges = {}

        for (const key in changes[entityId]) {
          if (key.startsWith('__')) continue
          if (key.startsWith('_'))
            entityChanges[key.substring(1)] = changes[entityId][key]
          else attribChanges[key] = changes[entityId][key]
        }

        try {
          console.log('PATCH', { ...entityChanges, attrib: attribChanges })
          await axios.patch(
            `/api/projects/${projectName}/${entityType}s/${entityId}`,
            { ...entityChanges, attrib: attribChanges }
          )
          updated.push(entityId)
        } catch {
          toast.error(`Unable to save ${entityChanges.name}`)
        }
      } // Patch

      if (!branchesToReload.includes(parentId)) branchesToReload.push(parentId)
      for (const eid of getBranchesToReload(entityId)) {
        if (!branchesToReload.includes(eid)) branchesToReload.push(eid)
      }
    } // PATCH EXISTING ENTITIES

    //
    // CREATE NEW ENTITIES
    //

    for (const entity of newNodes) {
      console.log('NEW ENTITY', entity)

      const entityType = entity.__entityType
      const newEntity = { ...entity }
      const entityChanges = changes[entity.id]

      // it is a new entity, so only valid attributes are those 
      // stored in `changes`. The rest are inherited ones
      newEntity.attrib = {} 
      for (const key in entityChanges || {}) {
        if (key.startsWith('__')) continue
        if (key.startsWith('_'))
          newEntity[key.substring(1)] = entityChanges[key]
        else {
          newEntity.attrib[key] = entityChanges[key]
        }
      }

      try {
        await axios.post(
          `/api/projects/${projectName}/${entityType}s`,
          newEntity
        )
        toast.success(`Saved new ${entityType} ${newEntity.name}`)
        created.push(newEntity.id)
      } catch {
        toast.error('Unable to save', entity.name)
      }

      // just reload the parent branch. new entities don't have children
      if (!branchesToReload.includes(newEntity.parentId))
        branchesToReload.push(newEntity.parentId)
    } // CREATE NEW ENTITIES

    //
    // Update local state
    //

    const affected = [...created, ...updated, ...deleted]

    setNewNodes((nodes) => {
      return nodes.filter(n => !created.includes(n.id) )
    })

    setChanges((nodes) => {
      for (const id in nodes){
        if (affected.includes(id))
          delete nodes[id]
      }
      return nodes
    }) // setChanges

    setNodeData(async (nodes) => {
      for (const id in nodes){
        if (affected.includes(id))
          delete nodes[id]
      }
      // Reload affected branches
      for (const branch of branchesToReload) {
        const res = await loadBranch(query, projectName, branch)
        Object.assign(nodes, res)
      }
      // Keep failed new nodes in node data
      for (const nodeId of newNodes){
        if (created.includes(nodeId))
          continue
        nodes[nodeId] = newNodes[nodeId]
      }
      return nodes
    }) // setNodeData
    setLoading(false)
  }, [newNodes, changes, query, projectName]) // commit

  //
  // Adding new nodes
  //

  const futureParents = useMemo(() => {
    // Returns a list of node ids from the current selection
    // for which children creation is available
    let parents = []
    for (const parentId in currentSelection){
      const node = currentSelection[parentId]
      if (!node)
        continue
      // unable to add children to unsaved nodes
      if (node.data.name?.startsWith("newnode"))
        continue
      // unable to add children to tasks
      if (node.data.__entityType !== "folder")
        continue
      parents.push(parentId)
    }
    return parents
  }, [currentSelection])

  const canAdd = futureParents.length > 0
  const canCommit = !isEmpty(changes) || newNodes.length

  const addNode = (entityType, root) => {
    const parents = root ? [null] : futureParents

    if (!parents.length){
      console.log("Nothing to add")
      return 
    }

    if (!root){
      // Adding children to existing nodes, so
      // ensure the parents are not leaves
      setNodeData((nodeData) => {
        for (const parentId of parents)
          nodeData[parentId].leaf = false
        return nodeData
      })
    }

    setNewNodes((nodes) => {
      let i = 0
      let newNodes = []
      for (const parentId of parents){
        const id = `newnode${nodes.length + i}`
        const newNode = {
          id,
          attrib: { ...nodeData[parentId]?.data.attrib || {} },
          ownAttrib: [],
          __entityType: entityType,
          __parentId: parentId || "root",
        }
        if (entityType === 'folder') newNode['parentId'] = parentId
        else if (entityType === 'task') {
          newNode['folderId'] = parentId
          newNode['taskType'] = 'Generic'
        }
        newNodes.push(newNode)
        i++ 
      }
      console.log("ADDING", newNodes)
      return [...nodes, ...newNodes]
    })

    if (!root){
      // Update expanded folders context object
      const exps = {...context.expandedFolders}
      for (const id of parents)
        exps[id] = true
      dispatch(setExpandedFolders(exps))
    }
  } // Add node


  //
  // Other user events handlers (Toolbar)
  //

  const onDelete = () => {
    // Mark the current selection for deletion.
    setNewNodes((newNodes) => {
      return newNodes.filter(node => !(node.id in currentSelection))
    })

    setChanges((changes) => {
      for (const id in currentSelection){
        if (id.startsWith('newnode'))
          continue
        changes[id] = changes[id] || {
          __entityType: nodeData[id].data.__entityType,
          __parentId: nodeData[id].data.__parentId,
        }
        changes[id].__action = "delete"
      }
      return changes
    })
  }


  const onRevert = () => {
    setChanges({})
    setNewNodes([])
  }


  const onAddFolder = () => addNode('folder')
  const onAddRootFolder = () => addNode('folder', true)
  const onAddTask = () => addNode('task')


  //
  // Table event handlers
  //

  const onToggle = (event) => {
    dispatch(setExpandedFolders(event.value))
  }

  const onSelectionChange = (event) => {
    if (selectionLocked)
      return
    dispatch(setFocusedFolders(Object.keys(event.value)))
  }

  const onRowClick = (event) => {
    const node = event.node.data
    if (node.__entityType !== "folder")
      return
    dispatch(
      setBreadcrumbs({
         parents: node.parents,
         folder: node.name,
       })
    )
  }

  //
  // Render the TreeTable
  //


  return (
    <main className="rows">
      <section className="invisible row">
        <Button
          icon="create_new_folder"
          label="Add folder"
          disabled={!canAdd}
          onClick={onAddFolder}
        />
        <Button
          icon="add_task"
          label="Add task"
          disabled={!canAdd}
          onClick={onAddTask}
        />
        <Button
          icon="create_new_folder"
          label="Add root folder"
          onClick={onAddRootFolder}
        />
        <Button 
          label="Delete selected" 
          icon="delete"
          onClick={onDelete} 
        />
        <InputSwitch
          checked={selectionLocked} 
          onChange={()=>setSelectionLocked(!selectionLocked)} 
          style={{width: 40, marginLeft: 10}}
        />
        Lock selection
        <Spacer />
        <Button
          icon="close"
          label="Revert Changes"
          onClick={onRevert}
          disabled={!canCommit}
        />
        <Button
          icon="check"
          label="Commit Changes"
          onClick={onCommit}
          disabled={!canCommit}
        />
      </section>
      <section className="column" style={{ flexGrow: 1 }}>
        <div className="wrapper">
          {loading && <Shade />}
          <TreeTable
            responsive="true"
            scrollable
            scrollHeight="100%"
            value={treeData}
            resizableColumns
            columnResizeMode="expand"
            expandedKeys={context.expandedFolders}
            onToggle={onToggle}
            selectionMode="multiple"
            selectionKeys={currentSelection}
            onSelectionChange={onSelectionChange}
            onRowClick={onRowClick}
            rowClassName={(rowData) => {
              return {
                changed:
                  rowData.key in changes || rowData.key.startsWith('newnode'),
                deleted:
                  rowData.key in changes && changes[rowData.key]?.__action == "delete",
              }
            }}
            selectOnEdit={false}
          >
            <Column
              field="name"
              header="Name"
              expander={true}
              body={(rowData) => formatName(rowData.data, changes)}
              style={{ width: 300 }}
              editor={(options) => {
                return stringEditor(
                  options,
                  updateName,
                  formatName(options.rowData, changes, false)
                )
              }}
            />
            <Column
              field="type"
              header="Type"
              body={(rowData) => formatType(rowData.data, changes)}
              style={{ width: 200 }}
              editor={(options) => {
                return typeEditor(
                  options,
                  updateType,
                  formatType(options.rowData, changes, false)
                )
              }}
            />
            {columns.map((col) => {
              return (
                <Column
                  key={col.name}
                  header={col.title}
                  field={col.name}
                  style={{ minWidth: 30 }}
                  body={(rowData) => formatAttribute(rowData.data, changes, col.name)}
                  editor={(options) => {
                    return col.editor(
                      options,
                      updateAttribute,
                      formatAttribute(options.rowData, changes, col.name, false)
                    )
                  }}
                />
              )
            })}
          </TreeTable>
        </div>
      </section>
    </main>
  )
}

export default EditorPage
