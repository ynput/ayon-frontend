import axios from 'axios'

import { useEffect, useState, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'
import { toast } from 'react-toastify'

import { isEmpty } from '/src/utils'
import { setBreadcrumbs, setExpandedFolders, setFocusedFolders } from '/src/features/context'
import { Shade, Spacer, Button } from '/src/components'
import { CellWithIcon } from '/src/components/icons'
import { getFolderTypeIcon, getTaskTypeIcon } from '/src/utils'

import { buildQuery } from './queries'
import { getColumns } from './utils'
import { stringEditor } from './editors'


const loadBranch = async (query, projectName, parentId) => {
  const variables = { projectName, parent: parentId || 'root' }
  console.log("Branch load")
  const response = await axios.post('/graphql', { query, variables })

  if (response.status !== 200) {
    toast.error(`Unable to load branch ${parentId}`)
    return {}
  }

  const data = response.data
  const nodes = {}

  // Add folders
  for (const edge of data.data.project.folders.edges) {
    const node = edge.node
    nodes[node.id] = {
      data: {
        ...node, 
        __parentId: parentId || "root",
        __entityType: 'folder',
      },
      leaf: !(node.hasChildren || node.hasTasks),
    }
  }

  // Add tasks
  for (const edge of data.data.project.tasks.edges) {
    const node = edge.node
    nodes[node.id] = {
      data: { 
        ...node, 
        __parentId: parentId || "root",
        __entityType: 'task' 
      },
      leaf: true, // Tasks never have children
    }
  }

  return nodes
}



const EditorPage = () => {
  const [loading, setLoading] = useState(false)

  const context = useSelector((state) => ({ ...state.context }))
  const settings = useSelector((state) => ({ ...state.settings }))
  const projectName = context.projectName
  const dispatch = useDispatch()

  const [currentNode, setCurrentNode] = useState(null)
  const [nodeData, setNodeData] = useState({})
  const [changes, setChanges] = useState({})
  const [newNodes, setNewNodes] = useState([])

  //
  // Helpers
  //

  const columns = useMemo(() => getColumns(settings.attributes), [settings.attributes])
  const query = useMemo(() => buildQuery(settings.attributes), [settings.attributes])

  //
  // Loading node data
  //

  const getUpdatedNodeData = async (nodeData, expandedKeys) => {

    // Load newly expanded branches
    for (const expandedKey of expandedKeys){
      if (!(expandedKey in parents)){
       const newNodes = await loadBranch(query, projectName, expandedKey)
       Object.assign(nodeData, newNodes)
      }
    }

    // Add unsaved nodes
    let newNodesIds = []
    for (const node of newNodes){
      nodeData[node.id] = {
        data: node,
        leaf: true
      }
      newNodesIds.push(node.id)
    }

    // Remove unsaved nodes which are deleted (via revert changes)
    for (const existingKey in nodeData){
      if (!existingKey.startsWith("newnode"))
        continue
      if (!newNodesIds.includes(existingKey))
        delete(nodeData[existingKey])
    }

    // remove children from closed branches
    for (const existingKey in parents){
      if (existingKey === "root") continue
      if (!(existingKey in expandedKeys)){
        for (const unusedKey in parents[existingKey]){
          delete(nodeData[unusedKey])
        }
      }
    }

    return {...nodeData}
  }


  useEffect(() => {
    setLoading(true)
    const expandedKeys = [...Object.keys(context.expandedFolders), "root"]
    getUpdatedNodeData(nodeData, expandedKeys).then(
      (result) => {
        setNodeData(result)
        setLoading(false)
      }
    )
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
      if (!(parentId in result))
        result[parentId] = []
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
    if (isEmpty(parents)){
      return []
    }
    const result = []

    const buildHierarchy = (parentId, target) => {
      if (!parents[parentId])
        return
      for (const childId of parents[parentId]){
        const node = {
          key: childId,
          data: nodeData[childId].data,
          leaf: nodeData[childId].leaf,
        }
        if (!node.leaf){
          node.children = []
          if (childId in context.expandedFolders)
            buildHierarchy(childId, node.children)
        }
        target.push(node)
      }
    } 

    buildHierarchy("root", result)
    return result
  }, [parents])

  // Handle selection change.
  // This also accept the selection from the project context, so 
  // when the selection is made in the browser page, it is propagated to the editor too
  // (but only the last focused folder, since editor does not support multiselect for
  // various reasons)

  useEffect(() => {
    const nodeId = context.focusedFolders.length && context.focusedFolders[context.focusedFolders.length - 1]
    if (!nodeId){
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
    setCurrentNode(node)
  }, [context.focusedFolders, treeData])

  //
  // Format / edit
  //

  const formatAttribute = (node, fieldName, styled = true) => {
    const chobj = changes[node.id]
    let className = ''
    let value = node.attrib[fieldName]
    if (chobj && chobj.hasOwnProperty(fieldName)) {
      value = chobj[fieldName]
      className = 'color-hl-01'
    }
    else if (node.ownAttrib && !node.ownAttrib.includes(fieldName)){
      className = 'faded'
    }
    if (!styled) return value

    return <span className={`editor-field ${className}`}>{value}</span>
  }

  const formatName = (node, styled = true) => {
    const chobj = changes[node.id]
    const className = chobj?._name ? 'color-hl-01' : ''
    const value = chobj?._name ? chobj._name : node.name
    if (!styled) return value
    if (node.__entityType === 'task')
      return (
        <CellWithIcon
          icon={getTaskTypeIcon(node.taskType)}
          text={value || "Unnamed task"}
          textStyle={{ fontStyle: 'italic' }}
          textClassName={{className}}
        />
      )
    else
      return (
        <CellWithIcon
          icon={getFolderTypeIcon(node.folderType)}
          textClassName={{className}}
          text={value || "Unnamed folder"}
        />
      )
  }



  const updateAttribute = (options, value) => {
    const id = options.rowData.id
    // double underscore prefix for local custom helpers,
    // single underscore prefix for top level properties of the entity
    // no prefix for attributes
    const rowChanges = changes[id] || {
      __entityType: options.rowData.__entityType,
      __parentId: options.rowData.__parentId,
    }
    rowChanges[options.field] = value
    setChanges((changes) => {
      return {...changes, [id]: rowChanges}
    })
  }

  const updateName = (options, value) => {
    const id = options.rowData.id
    const rowChanges = changes[id] || {
      __entityType: options.rowData.__entityType,
      __parentId: options.rowData.__parentId,
    }
    rowChanges["_name"] = value
    setChanges((changes) => {
      return {...changes, [id]: rowChanges}
    })
  }

  //
  // User events handlers
  //

  const onDeleteSelected = async () => {
    if (!currentNode)
      return
    let branchesToReload = []
    branchesToReload.push(currentNode.__parentId)

    if (currentNode.id.startsWith("newnode")){
      setNewNodes(newnodes => {
        return newnodes.filter((node) => node.id !== currentNode.id)
      })
      return
    }

    try {
      const res = await axios.delete(
          `/api/projects/${projectName}/${currentNode.__entityType}s/${currentNode.id}`
        )
      toast.success(`${currentNode.name} deleted`)
    } catch {
      toast.error(`Unable to delete ${currentNode.name}`)
    }

    const newNodeData = { ...nodeData }
    // clean-up branch
    for (const nodeId in newNodeData){
      const node = newNodeData[nodeId]
      if (branchesToReload.includes(node.data.__parentId))
        delete(newNodeData[nodeId])
    }
    for (const branch of branchesToReload){
       const newNodes = await loadBranch(query, projectName, branch)
       Object.assign(newNodeData, newNodes)
    }
    setNodeData(newNodeData)
//    setNewNodes([])
  }


  const onRevert = () => {
    setChanges({})
    setNewNodes([])
  }

  const getBranchesToReload = (entityId) => {
    let result = [entityId]
    if (!parents[entityId])
      return result
    for (const chId of parents[entityId])
      result = [...result, ...getBranchesToReload(chId)]
    return result
  }

  const onCommit = async () => {
    setLoading(true)
    let branchesToReload = []

    for (const entity of newNodes){

      console.log("NEW ENTITY", entity)

      const entityType = entity.__entityType
      const newEntity = {...entity}
      const entityChanges = changes[entity.id]

      for (const key in (entityChanges || {})){
        if (key.startsWith("__")) continue
        if (key.startsWith("_"))
          newEntity[key.substring(1)] = entityChanges[key]
        else
          newEntity.attrib[key] = entityChanges[key]
      }
      delete(newEntity.id)

      console.log("POST ENTITY", newEntity)

      try {
        await axios.post(
          `/api/projects/${projectName}/${entityType}s`,
          newEntity
        )
        toast.success(`Saved new ${entityType} ${newEntity.name}`)
      } catch {
        toast.error("Unable to save", entity.name)
      }

      // just reload the parent branch. new entities don't have children
      if (!branchesToReload.includes(newEntity.parentId))
        branchesToReload.push(newEntity.parentId)
    }
    
    for (const entityId in changes) {
      if (entityId.startsWith("newnode"))
        continue
      const entityType = changes[entityId].__entityType
      const parentId = changes[entityId].__parentId
      const attribChanges = {}
      const entityChanges = {}

      for (const key in changes[entityId]) {
        if (key.startsWith('__')) continue
        if (key.startsWith('_'))
          entityChanges[key.substring(1)] = changes[entityId][key]
        else
          attribChanges[key] = changes[entityId][key]
      }

      try {
        console.log("PATCH", {...entityChanges, attrib: attribChanges})
        await axios.patch(
          `/api/projects/${projectName}/${entityType}s/${entityId}`,
          { ...entityChanges, attrib: attribChanges }
        )
        delete(changes[entityId])
      }
      catch {
        toast.error(`Unable to save ${entityChanges.name}`)
      }

      if (!branchesToReload.includes(parentId))
        branchesToReload.push(parentId)

      for (const eid of getBranchesToReload(entityId)){
        if (!branchesToReload.includes(eid))
          branchesToReload.push(eid)
      }
    }

    //
    // Update node data
    //

    const newNodeData = { ...nodeData }

    // remove previously unsaved nodes 
    //(they should come back in the loadBranch request with the valid ID)
    for (const key in newNodeData){
      if (key.startsWith("newnode"))
        delete (newNodeData[key])
    }

    for (const branch of branchesToReload){
       const newNodes = await loadBranch(query, projectName, branch)
       Object.assign(newNodeData, newNodes)
    }

    setNewNodes([])
    setChanges({})
    setNodeData(newNodeData)
    setLoading(false)
  } // commit


  const onToggle = (event) => {
    dispatch(setExpandedFolders(event.value))
  }


  const onSelectionChange = (event) => {
    dispatch(setFocusedFolders([event.value]))
  }

  //
  // Adding new nodes
  //

  // New nodes can be added only when a parent folder is selected.
  // The parent folder must exist in the database (it is not possible to create children of unsaved folders)
  const canAdd = currentNode && currentNode?.__entityType === "folder" && !(currentNode?.id?.startsWith("newnode"))
  const canCommit = (!isEmpty(changes)) || newNodes.length
  
  const addNode = (entityType) => {
    if (!currentNode){
      return
    }
    const parentId = currentNode.id

    setNodeData((nodeData) => {
      nodeData[parentId].leaf = false
      return nodeData
    })

    setNewNodes((newNodes) => {
      //const name = `new_${entityType}_${newNodes.length + 1}`
      const id = `newnode${newNodes.length + 1}`
      const newNode = {
        id,
        attrib: {...currentNode.attrib},
        __entityType: entityType,
        __parentId: parentId,
      }
      if (entityType === "folder")
        newNode["parentId"] = parentId
      else if (entityType === "task"){
        newNode["folderId"] = parentId
        newNode["taskType"] = "Generic"
      }
      return [...newNodes, newNode]
    })


    // if the parent is not expanded, open the branch (to have a visual feedback)
    if (!(parentId in context.expandedFolders)){
      dispatch(setExpandedFolders({...context.expandedFolders, [parentId]: true}))
    }

  }

  const onAddFolder = () => addNode("folder")
  const onAddTask = () => addNode("task")


  //
  // Render the TreeTable
  //

  return (
    <main className="rows">
      <section className="invisible row">
        <Button icon="create_new_folder" label="Add folder" disabled={!canAdd} onClick={onAddFolder} />
        <Button icon="add_task" label="Add task" disabled={!canAdd} onClick={onAddTask} />
        <Button label="Delete selected" onClick={onDeleteSelected}/>
        <Spacer />
        <Button icon="close" label="Revert Changes" onClick={onRevert} disabled={!canCommit}/>
        <Button icon="check" label="Commit Changes" onClick={onCommit} disabled={!canCommit}/>
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
            selectionMode="single"
            selectionKeys={currentNode && currentNode.id}
            onSelectionChange={onSelectionChange}
            rowClassName={(rowData) => {return {"changed": (rowData.key in changes || rowData.key.startsWith('newnode'))}} }
            selectOnEdit={false}
          >
            <Column
              field="name"
              header="Name"
              expander={true}
              body={(rowData) => formatName(rowData.data)}
              style={{ width: 300 }}
              editor={(options) => {
                return stringEditor(options, updateName, formatName(options.rowData, false))
              }}
            />
            {columns.map((col) => {
              return (
                <Column
                  key={col.name}
                  header={col.title}
                  field={col.name}
                  style={{ minWidth: 30 }}
                  body={(rowData) => formatAttribute(rowData.data, col.name)}
                  editor={(options) => {
                    return col.editor(
                      options,
                      updateAttribute,
                      formatAttribute(options.rowData, col.name, false)
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
