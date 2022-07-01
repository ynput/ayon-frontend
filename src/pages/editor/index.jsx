import axios from 'axios'

import { useEffect, useState, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'

import { isEmpty } from '/src/utils'
import { setBreadcrumbs, setExpandedFolders, setFocusedFolders } from '/src/features/context'
import { Shade, Spacer, Button } from '/src/components'

import { buildQuery } from './queries'
import { formatName, getColumns} from './utils'


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

  const parents = useMemo(() => {
    // This is an auto-generated object in the form of:
    //   { parentId: [child1Id, child2Id....] 
    // It is updated when nodeData changes and it speeds up
    // building hierarchy

    const result = {}
    for (const childId in nodeData) {
      const parentId = nodeData[childId].data.parentId
      if (!(parentId in result))
        result[parentId] = []
      result[parentId].push(childId)
    }
    return result
  }, [nodeData])

  //
  // Loading node data
  //

  const loadBranch = async (parentId) => {
    const variables = { projectName, parent: parentId || 'root' }
    const response = await axios.post('/graphql', { query, variables })

    if (response.status !== 200) {
      console.log(response)
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
          parentId,
          entityType: 'folder',
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
          parentId,
          entityType: 'task' 
        },
        leaf: true, // Tasks never have children
      }
    }

    return nodes
  }


  const getUpdatedNodeData = async (nodeData, expandedKeys) => {
    // Load newly expanded branches
    for (const expandedKey of expandedKeys){
      if (!(expandedKey in parents)){
       const newNodes = await loadBranch(expandedKey)
       Object.assign(nodeData, newNodes)
      }
    }

    // Add unsaved nodes
    for (const node of newNodes){
      nodeData[node.id] = {
        data: node,
        leaf: true
      }
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
    if (node.entityType === 'folder') {
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
    if (!styled) return value

    return <span className={`editor-field ${className}`}>{value}</span>
  }

  const updateAttribute = (options, value) => {
    const id = options.rowData.id
    // double underscore prefix for local custom helpers,
    // single underscore prefix for top level properties of the entity
    // no prefix for attributes
    const rowChanges = changes[id] || {
      __entityType: options.rowData.entityType,
      __entityId: options.rowData.id,
      __parentId: options.rowData.parentId,
    }
    rowChanges[options.field] = value
    setChanges((changes) => {
      return {...changes, [id]: rowChanges}
    })
  }

  //
  // User events handlers
  //

  const onRevert = () => {
    setChanges({})
  }

  const onCommit = async () => {
    setLoading(true)
    let branchesToReload = []

    for (const entity of newNodes){
      // TODO
      // use post to create new nodes.
      // don't forget to apply data from "changes"
    }
    setNewNodes([])
    
    for (const entityId in changes) {
      if (entityId.startsWith("newnode"))
        continue
      const entityType = changes[entityId].__entityType
      const parentId = changes[entityId].__parentId
      const attribChanges = {}
      const entityChanges = {}

      for (const k in changes[entityId]) {
        if (k.startsWith('__')){
          continue}
        else if (k.startsWith('_')) {
          entityChanges[k.substring(1)] = changes[entityId][k]
        } else {
          attribChanges[k] = changes[entityId][k]
        }
      }

      const response = await axios.patch(
        `/api/projects/${projectName}/${entityType}s/${entityId}`,
        { ...entityChanges, attrib: attribChanges }
      )

      if (response.status >= 400) {
        //TODO: toast
        console.log(response)
      } else {
        delete(changes[entityId])
      }

      if (!branchesToReload.includes(parentId))
        branchesToReload.push(parentId)
    }

    // Reload modified branches
    const newNodeData = {...nodeData}
    for (const branch of branchesToReload){
       const newNodes = await loadBranch(branch)
       Object.assign(newNodeData, newNodes)
    }
    setNodeData(newNodeData)
    setLoading(false)
  }

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
  const canAdd = currentNode && currentNode?.entityType === "folder" && !(currentNode?.id?.startsWith("newnode"))
  
  const addNode = (entityType) => {
    if (!currentNode){
      return
    }
    const parentId = currentNode.id
    // console.log(`Adding new ${entityType} to parent ${parentId} (${currentNode.id})`)
    setNewNodes((newNodes) => {
      const name = `New ${entityType} ${newNodes.length + 1}`
      const id = `newnode${newNodes.length + 1}`
      return [...newNodes, {
        id,
        entityType,
        parentId,
        name,
        attrib: {...currentNode.attrib}
      }]
    })


    // if the parent is not expanded, open the branch (to have a visual feedback)
    if (!(parentId in context.expandedFolders)){
      console.log("set expanded folders", parentId)
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
        <Spacer />
        <Button icon="close" label="Revert Changes" onClick={onRevert} />
        <Button icon="check" label="Commit Changes" onClick={onCommit} />
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
            rowClassName={(rowData) => {return {"changed": (rowData.key in changes)}} }
          >
            <Column
              field="name"
              header="Name"
              expander
              body={(row) => formatName(row)}
              style={{ width: 300 }}
            />
            {columns.map((col) => {
              return (
                <Column
                  key={col.name}
                  header={col.title}
                  field={col.name}
                  style={{ width: 100 }}
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
