import { useEffect, useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'

import { Shade, Spacer } from '../../components'
import { CellWithIcon } from '../../components/icons'

import { Button } from 'primereact/button'
import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'

import { arrayEquals, getFolderTypeIcon } from '../../utils'
import { buildQuery } from './queries'
import { stringEditor, integerEditor, floatEditor } from './editors'

const formatName = (row) => {
  if (row.data.entityType === 'task')
    return (
      <span>
        <i>{row.data.name}</i>
      </span>
    )
  else
    return (
      <CellWithIcon
        icon={getFolderTypeIcon(row.data.folderType)}
        text={row.data.name}
      />
    )
}

const ManagerView = ({ projectName, settings }) => {
  const [hierarchy, setHierarchy] = useState([])
  const [changes, setChanges] = useState({})
  const [loading, setLoading] = useState(false)
  const [expandedKeys, setExpandedKeys] = useState({})

  const columns = useMemo(() => {
    if (!settings.attributes) return []
    let cols = []
    for (const attrib of settings.attributes) {
      if (attrib.scope.includes('folder')) {
        let editor
        if (attrib.attribType === 'integer') {
          editor = integerEditor
        } else if (attrib.attribType === 'float') {
          editor = floatEditor
        } else {
          editor = stringEditor
        }
        cols.push({
          name: attrib.name,
          title: attrib.title,
          editor: editor,
        })
      }
    }
    return cols
  }, [settings.attributes])

  const query = useMemo(() => {
    if (!settings.attributes) return null
    return buildQuery(settings.attributes)
  }, [settings.attributes])

  const loadHierarchy = async (path = []) => {
    if (!query) return

    setLoading(true)

    const parentId = path.length > 0 ? path[path.length - 1] : null

    const variables = { projectName, parent: parentId || 'root' }
    const response = await axios.post('/graphql', { query, variables })

    if (response.status !== 200) {
      console.log(response)
      setLoading(false)
      return
    }

    const data = response.data

    const pathArr = path ? path : []
    let nodes = []
    // Add children
    for (const edge of data.data.project.folders.edges) {
      const node = edge.node
      nodes.push({
        data: { ...node, entityType: 'folder' },
        key: node.id,
        leaf: !(node.hasChildren || node.hasTasks),
        children: [],
        path: [...pathArr, node.id],
      })
    }

    // Add tasks
    for (const edge of data.data.project.tasks.edges) {
      const node = edge.node
      nodes.push({
        data: { ...node, entityType: 'task' },
        key: node.id,
        leaf: true,
        children: [],
        path: [...pathArr, node.id],
      })
    }

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
    if (chobj && chobj.hasOwnProperty(fieldName)) {
      const nval = chobj[fieldName]
      if (styled) return <span style={{ color: 'red' }}>{nval}</span>
      else return nval
    }
    return node.attrib[fieldName]
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

  //
  // Display table
  //

  return (
    <>
      <section className="invisible row">
        <Button icon="pi pi-plus" label="Add folder" disabled />
        <Button icon="pi pi-plus" label="Add task" disabled />
        <Spacer />
        <Button
          icon="pi pi-times"
          label="Revert Changes"
          onClick={() => setChanges({})}
        />
        <Button icon="pi pi-check" label="Commit Changes" onClick={onCommit} />
      </section>

      <section className="column" style={{ flexGrow: 1 }}>
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
      </section>
    </>
  )
}

//
// Page wrapper
//

const ManagerPage = () => {
  const context = useSelector((state) => ({ ...state.context }))
  const settings = useSelector((state) => ({ ...state.settings }))
  const projectName = context.projectName
  return (
    <main className="rows">
      <ManagerView projectName={projectName} settings={settings} />
    </main>
  )
}
export default ManagerPage
