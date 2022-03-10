import { useEffect, useState, useMemo } from 'react'
import { useFetch } from 'use-http'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'

import ProjectWrapper from '../../containers/project-wrapper'
import { Shade, FolderTypeIcon } from '../../components'

import { Button } from 'primereact/button'
import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'

import { buildQuery } from './queries'
import { stringEditor, integerEditor, floatEditor } from './editors'


const formatName = (row) => {
  if (row.data.entityType === "task")
    return (
      <span>
        <i>{row.data.name}</i>
      </span>
    )
  else
    return (
      <>
        <FolderTypeIcon name={row.data.folderType}/>
        <span style={{marginLeft: 10}}>
          {row.data.name}
        </span>
      </>
    )
}


const ManagerView = ({projectName, settings}) => {
  const [hierarchy, setHierarchy] = useState([])
  const [request, response, loading] = useFetch('/graphql')


  const columns = useMemo(() => {
    if (!settings.attributes)
      return []
    let cols = []
    for (const attrib of settings.attributes){
      if (attrib.scope.includes("folder")){
        let editor
        if (attrib.attribType === "integer"){
            editor = integerEditor
        }
        else if (attrib.attribType === "float"){
            editor = floatEditor
        }
        else {
            editor = stringEditor
        }
        cols.push({
          name: attrib.name,
          title: attrib.title,
          editor: editor
        })
      }
    }
    return cols
  }, [settings.attributes])


  const query = useMemo(() => {
    if (!settings.attributes)
      return null
    return buildQuery(settings.attributes)
  }, [settings.attributes])



  const loadHierarchy = async (parent, path = null) => {
    if (!query)
      return
    const params = { projectName, parent }
    const pathArr = path ? path : []
    const data = await request.query(query, params)
    if (!response.ok) {
      toast.error('Unable to load hierarchy')
      return
    }

    let nodes = []
    // Add children
    for (const edge of data.data.project.folders.edges) {
      const node = edge.node
      nodes.push({
        data: {...node, entityType: "folder"},
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
        data: {...node, entityType: "task"},
        key: node.id,
        leaf: true,
        children: [],
        path: [...pathArr, node.id],
      })
    }

    if (parent === 'root') {
      setHierarchy(nodes)
      return
    }

    // TODO: try to do this in one pass
    let result = [...hierarchy]
    const updateHierarchy = (src) => {
      for (let node of src || result) {
        if (node.data.id === parent) {
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
  }

  useEffect(() => {
    if (!projectName) return
    loadHierarchy('root')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectName])

  const onExpand = (event) => {
    // if (event.node.children.length) return
    loadHierarchy(event.node.key, event.node.path)
  }

  return (
    <>
      <section className="invisible row">
        <Button icon="pi pi-plus" label="Add folder" disabled />
        <Button icon="pi pi-plus" label="Add task" disabled />
        <div style={{ flexGrow: 1 }} />
      </section>
      <section className="column" style={{ flexGrow: 1 }}>
        {loading && <Shade />}
        <TreeTable
          responsive
          scrollable
          scrollHeight="100%"
          value={hierarchy}
          onExpand={onExpand}

          resizableColumns
          columnResizeMode="expand"
          scrollDirection="both"
        >
          <Column 
            field="name" 
            header="Name"     
            expander
            body={(row) => formatName(row)}
            style={{ width: 300}}
          />

          { columns.map((col) => {

            return (
              <Column 
                key={col.name} 
                header={col.title}
                field={`attrib.${col.name}`}
                style={{ width: 100}}
                editor={(options) => col.editor(options)} 
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
  const context = useSelector((state) => ({ ...state.contextReducer }))
  const settings = useSelector((state) => ({ ...state.settingsReducer }))
  const projectName = context.projectName
  return (
    <ProjectWrapper>
      <main className="rows">
        <ManagerView projectName={projectName} settings={settings}/>
      </main>
    </ProjectWrapper>
  )
}
export default ManagerPage
