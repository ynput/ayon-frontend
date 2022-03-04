import { useEffect, useState } from 'react'
import { useFetch } from 'use-http'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'

import ProjectWrapper from '../containers/project-wrapper'
import { Shade } from '../components'

import { Button } from 'primereact/button'
import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'

const FOLDERS_QUERY = `
    query FolderTree($projectName: String!, $parent: String!) {
        project(name: $projectName) {
            folders(parentId: $parent) {
                edges {
                    node {
                        id
                        name
                        hasChildren
                        childrenCount
                        attrib {
                            resolutionWidth
                            resolutionHeight
                            fps
                        }
                    }
                }
            }
        }
    }
`

const ManagerPage = () => {
  const context = useSelector((state) => ({ ...state.contextReducer }))
  const projectName = context.projectName
  const [hierarchy, setHierarchy] = useState([])
  const [request, response, loading] = useFetch('/graphql')

  const loadHierarchy = async (parent, path = null) => {
    let nodes = []
    const params = { projectName, parent }
    const pathArr = path ? path : []
    console.log('REQUESTING HIERARCHY', params)
    const data = await request.query(FOLDERS_QUERY, params)
    console.log(data)
    if (!response.ok) {
      toast.error('Unable to load hierarchy')
    }

    for (const edge of data.data.project.folders.edges) {
      nodes.push({
        data: {
          id: edge.node.id,
          name: edge.node.name,
          hasChildren: edge.node.hasChildren,
          childrenCount: edge.node.childrenCount,
          resolution:
            edge.node.attrib.resolutionWidth +
            'x' +
            edge.node.attrib.resolutionHeight,
          fps: edge.node.attrib.frameRate,
        },
        key: edge.node.id,
        leaf: !edge.node.hasChildren,
        children: [],
        path: [...pathArr, edge.node.id],
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
    // if (event.node.children.length)
    //    return
    loadHierarchy(event.node.key, event.node.path)
  }

  return (
    <ProjectWrapper>
      <main className="rows">
        <section className="invisible row">
          <Button icon="pi pi-plus" label="This" disabled />
          <Button icon="pi pi-plus" label="is" disabled />
          <Button icon="pi pi-plus" label="a" disabled />
          <Button icon="pi pi-plus" label="mockup" disabled />
          <Button icon="pi pi-plus" label="toolbar" disabled />
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
          >
            <Column field="name" header="Name" expander></Column>
            <Column field="childrenCount" header="ChildrenCount"></Column>
            <Column field="id" header="ID"></Column>
            <Column field="resolution" header="Resolution"></Column>
            <Column field="fps" header="FPS"></Column>
          </TreeTable>
        </section>
      </main>
    </ProjectWrapper>
  )
}

export default ManagerPage
