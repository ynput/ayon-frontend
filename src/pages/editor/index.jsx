import axios from 'axios'

import { useEffect, useState, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'

import { Shade, Spacer, Button } from '/src/components'
import { setBreadcrumbs, setExpandedFolders } from '/src/features/context'
import { isEmpty } from '/src/utils'

import { buildQuery } from './queries'
import { formatName, getColumns} from './utils'


const EditorView = () => {
  const [loading, setLoading] = useState(false)

  const context = useSelector((state) => ({ ...state.context }))
  const settings = useSelector((state) => ({ ...state.settings }))
  const projectName = context.projectName
  const dispatch = useDispatch()

  const [nodeData, setNodeData] = useState({})

  const columns = useMemo(() => getColumns(settings.attributes), [settings.attributes])
  const query = useMemo(() => buildQuery(settings.attributes), [settings.attributes])


  const loadBranch = async (parentId) => {
    const variables = { projectName, parent: parentId || 'root' }
    const response = await axios.post('/graphql', { query, variables })

    if (response.status !== 200) {
      console.log(response)
      return {}
    }

    const data = response.data
    const nodes = {}

    for (const edge of data.data.project.folders.edges) {
      const node = edge.node
      nodes[node.id] = {
        data: { ...node, entityType: 'folder' },
        parentId,
        leaf: !(node.hasChildren || node.hasTasks),
      }
    }

    // Add tasks
    for (const edge of data.data.project.tasks.edges) {
      const node = edge.node
      nodes[node.id] = {
        data: { ...node, entityType: 'task' },
        parentId,
        leaf: true,
      }
    }
    return nodes
  }


  const parents = useMemo(() => {
    /*
      { parentId: [child1Id, child2Id....] }
    */

    const result = {}
    for (const childId in nodeData) {
      const parentId = nodeData[childId].parentId
      if (!(parentId in result))
        result[parentId] = []
      result[parentId].push(childId)
    }
    return result
  }, [nodeData])


  const getUpdatedNodeData = async (nodeData, expandedKeys) => {
    // Load newly expanded branches
    for (const expandedKey of expandedKeys){
      if (!(expandedKey in parents)){
       const newNodes = await loadBranch(expandedKey)
       Object.assign(nodeData, newNodes)
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
        console.log("RES", result)
        setNodeData(result)
        setLoading(false)
      }
    )
  }, [context.expandedFolders])




  const treeData = useMemo(() => {
    if (isEmpty(parents)){
      return []
    }
    const result = []

    const buildHierarchy = (parentId, target) => {
      for (const childId of parents[parentId]){
        console.log(childId, nodeData[childId])
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


  //

  const onToggle = (event) => {
    dispatch(setExpandedFolders(event.value))
  }


  return (
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
          >
            <Column
              field="name"
              header="Name"
              expander
              body={(row) => formatName(row)}
              style={{ width: 300 }}
            />
          </TreeTable>
        </div>
      </section>
  )


  /*

  const loadHierarchy = async (path = []) => {
    if (!query) return

    setLoading(true)


    }


    const pathArr = path ? path : []
    let nodes = []
    // Add children
  
    if (!parentId) {
      setHierarchy(nodes)
      setLoading(false)
      return
    }

    // TODO: try to do this in one pass
    let result = [...hierarchy]
    const updateHierarchy = (src) => {
      for (let node of src || result) {
        if (node.data.id === parentId) {
          node.children = nodes
          return
        } else {
          if (node.children) {
            updateHierarchy(node.children)
          }
        }
      }
    }
    updateHierarchy()
    setHierarchy(result)
    setLoading(false)
  }

  useEffect(() => {
    if (!projectName) return
    loadHierarchy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectName])

  const onExpand = (event) => {
    // if (event.node.children.length) return
    loadHierarchy(event.node.path)
  }

  const onRowClick = (event) => {
    const node = event.node.data
    if (node.entityType === 'folder') {
      dispatch(
        setBreadcrumbs({
          parents: node.parents,
          folder: node.name,
        })
      )
    }
  }

  //
  // Format / Edit
  //

  const onAttributeEdit = (options, value) => {
    const id = options.rowData.id
    const rowChanges = changes[id] || {
      _entityType: options.rowData.entityType,
      _entityId: options.rowData.id,
      _path: options.node.path,
    }
    rowChanges[options.field] = value
    setChanges({ ...changes, [id]: rowChanges })
  }

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

  const onCommit = async () => {
    let branchesToReload = []

    for (const entityId in changes) {
      const entityType = changes[entityId]._entityType
      const parentPath = changes[entityId]._path.slice(0, -1)
      const entityChanges = {}
      for (const k in changes[entityId]) {
        if (k.startsWith('_')) continue
        entityChanges[k] = changes[entityId][k]
      }

      const response = await axios.patch(
        `/api/projects/${projectName}/${entityType}s/${entityId}`,
        { attrib: entityChanges }
      )

      if (response.status !== 200) {
        //TODO: toast
        console.log(response)
      }

      if (branchesToReload.length === 0) branchesToReload.push(parentPath)

      for (const branch of branchesToReload) {
        if (arrayEquals(branch, parentPath)) continue
        branchesToReload.push(parentPath)
      }
    }

    const newExpandedKeys = {}
    for (const expandedKey in expandedKeys) {
      if (changes.hasOwnProperty(expandedKey)) continue
      newExpandedKeys[expandedKey] = true
    }

    for (const branch of branchesToReload) {
      await loadHierarchy(branch)
    }

    setChanges({})
    setExpandedKeys(newExpandedKeys)
  }

  */

  //
  // Display table
  //

  return (<div></div>)


  return (
    <>
      <section className="invisible row">
        <Button icon="create_new_folder" label="Add folder" disabled />
        <Button icon="add_task" label="Add task" disabled />
        <Spacer />
        <Button
          icon="close"
          label="Revert Changes"
          onClick={() => setChanges({})}
        />
        <Button icon="check" label="Commit Changes" onClick={onCommit} />
      </section>

      <section className="column" style={{ flexGrow: 1 }}>
        <div className="wrapper">
          {loading && <Shade />}
          <TreeTable
            responsive="true"
            scrollable
            scrollHeight="100%"
            value={hierarchy}
            onExpand={onExpand}
            resizableColumns
            columnResizeMode="expand"
            expandedKeys={expandedKeys}
            onToggle={(e) => setExpandedKeys(e.value)}
            onRowClick={onRowClick}
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
                      onAttributeEdit,
                      formatAttribute(options.rowData, col.name, false)
                    )
                  }}
                />
              )
            })}
          </TreeTable>
        </div>
      </section>
    </>
  )
}

//
// Page wrapper
//

const EditorPage = () => {
  return (
    <main className="rows">
      <EditorView />
    </main>
  )
}
export default EditorPage
