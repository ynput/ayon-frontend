import axios from 'axios'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import PubSub from '/src/pubsub'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'
import { InputSwitch } from 'primereact/inputswitch'
import { ContextMenu } from 'primereact/contextmenu'
import {
  Shade,
  Spacer,
  Button,
  Section,
  Toolbar,
  Panel,
  TableWrapper,
} from '/src/components'

import { isEmpty, sortByKey } from '/src/utils'

import {
  setBreadcrumbs,
  setExpandedFolders,
  setFocusedFolders,
} from '/src/features/context'

import { buildQuery } from './queries'
import { getColumns, formatName, formatType, formatAttribute } from './utils'
import { stringEditor, typeEditor } from './editors'
import { loadBranch, getUpdatedNodeData } from './loader'

const EditorPage = () => {
  const [loading, setLoading] = useState(false)

  const context = useSelector((state) => ({ ...state.context }))
  const settings = useSelector((state) => ({ ...state.settings }))
  const projectName = context.projectName
  const dispatch = useDispatch()

  const [nodeData, setNodeData] = useState({})
  const [changes, setChanges] = useState({})
  const [newNodes, setNewNodes] = useState([])
  const [errors, setErrors] = useState({})
  const [selectionLocked, setSelectionLocked] = useState(false)
  const contextMenuRef = useRef(null)

  const currentSelection = useMemo(() => {
    // This object holds the information on current selected nodes.
    // It has the same structure as nodeData, e.g. {objecId: nodeData, ...}
    // so it is compatible with the treetable selection argument and it
    // also provides complete node information
    const result = {}
    for (const key of context.focusedFolders) result[key] = nodeData[key]
    for (const key of context.focusedTasks) result[key] = nodeData[key]
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
        >warning</span>
      )
    }
  }

  useEffect(() => {
    setLoading(true)
    const expandedKeys = [...Object.keys(context.expandedFolders), 'root']
    getUpdatedNodeData(
      nodeData,
      newNodes,
      expandedKeys,
      parents,
      query,
      projectName
    ).then((result) => {
      setNodeData(result)
      setLoading(false)
    })
  }, [context.expandedFolders, newNodes])

  //
  // External events handling
  //

  const handlePubSub = async (topic, message) => {
    if (topic !== "entity.update") return
    if (message.project?.toLowerCase() !== projectName.toLowerCase()) return

    const getEntity = async (entityType, entityId) => {
      let data = {}
      try {
        const result = await axios.get(
          `/api/projects/${projectName}/${entityType}s/${entityId}`
        )
        data = result.data
      } catch {}
      return data
    }

    const updateEntities = async (entityType, ids) => {
      const patch = {}
      for (const entityId of ids) {
        const newEntity = await getEntity(entityType, entityId)
        patch[entityId] = newEntity
      }
      if (isEmpty(patch)) return

      setNodeData((nd) => {
        const result = { ...nd }
        for (const entityId in patch) {
          const row = { ...result[entityId] }
          Object.assign(row.data, patch[entityId])
          result[entityId] = row
        }
        return result
      })
    }

    // This is used just to get the current list of nodes to be updated
    setNodeData((nd) => {
      const toUpdate = message.summary.ids.filter((id) => id in nd)
      if (toUpdate.length) updateEntities(message.summary.entityType, toUpdate)
      return nd
    })
  } // handlePubSub

  useEffect(() => {
    const token = PubSub.subscribe('entity.update', handlePubSub)
    return () => PubSub.unsubscribe(token)
  }, [])

  //
  // Build hierarchy
  //

  const parents = useMemo(() => {
    // This is an auto-generated object in the form of:
    //   { parentId: [child1Id, child2Id....]
    // It is updated when nodeData changes and it speeds up
    // building hierarchy
    console.log('NodeData changed')

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

  //
  // Update handlers
  //

  const updateAttribute = (options, value) => {
    setChanges((changes) => {
      for (const id in currentSelection) {
        changes[id] = changes[id] || {
          __entityType: nodeData[id].data.__entityType,
          __parentId: nodeData[id].data.__parentId,
        }
        changes[id][options.field] = value
      }
      return changes
    })

    // Force table render when selection is locked
    if (selectionLocked) dispatch(setFocusedFolders(context.focusedFolders))
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
    const key =
      options.rowData.__entityType === 'folder' ? '_folderType' : '_taskType'
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

  const onCommit = useCallback(() => {
    const branchesToReload = []
    const operations = []

    // PATCH / DELETE EXISTING ENTITIES

    for (const entityId in changes) {
      if (entityId.startsWith('newnode')) continue

      const entityType = changes[entityId].__entityType
      const parentId = changes[entityId].__parentId

      if (changes[entityId].__action === 'delete') {
        operations.push({
          id: entityId,
          type: 'delete', 
          entityType, 
          entityId 
        })

      } else {
        // End delete, begin patch
        const attribChanges = {}
        const entityChanges = {}

        for (const key in changes[entityId]) {
          if (key.startsWith('__')) continue
          if (key.startsWith('_'))
            entityChanges[key.substring(1)] = changes[entityId][key]
          else attribChanges[key] = changes[entityId][key]
        }

        operations.push({
          id: entityId,
          type: 'update',
          entityType,
          entityId,
          data: {...entityChanges, attrib: attribChanges}
        })
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

      operations.push({
        id: entity.id,
        type: 'create', 
        entityType, 
        data: newEntity,
      })

      // just reload the parent branch. new entities don't have children
      if (!branchesToReload.includes(newEntity.parentId))
        branchesToReload.push(newEntity.parentId)
    } // CREATE NEW ENTITIES


    // Send the changes to the server

    setLoading(true)
    axios
      .post(`/api/projects/${projectName}/operations`, {operations})
      .then((res) => {

        // console.log("OPS result", res.data.operations)

        if (!res.data.success) {
          toast.warn('Errors occured during save')
        }

        const updated = res.data.operations.filter(op => op.type === 'update' && op.success).map(op => op.id)
        const created = res.data.operations.filter(op => op.type === 'create' && op.success).map(op => op.id)
        const deleted = res.data.operations.filter(op => op.type === 'delete' && op.success).map(op => op.id)

        const affected = [...created, ...updated, ...deleted]

        setErrors(() => {
          const result = {}
          for (const op of res.data.operations){
            if (!op.success) result[op.id] = op.error
          }
          return result
        })

        // Remove succesfully created nodes from the newNodes list
        setNewNodes(nodes => nodes.filter((n) => !created.includes(n.id)))

        // Remove successful operations from the changes
        setChanges((nodes) => {
          const result = {}
          for (const id of Object.keys(nodes).filter((n) => !affected.includes(n))) {
            result[id] = nodes[id]
          }
          return result
        }) // setChanges

        // Create a new nodeData object with the updated data. Reload the
        // branches that were affected by the changes
        setNodeData(async (nodes) => {
          for (const id in nodes) {
            if (affected.includes(id)) delete nodes[id]
          }
          // Reload affected branches
          for (const branch of branchesToReload) {
            const res = await loadBranch(query, projectName, branch)
            Object.assign(nodes, res)
          }
          // Keep failed new nodes in node data
          for (const nodeId of newNodes) {
            if (created.includes(nodeId)) continue
            nodes[nodeId] = newNodes[nodeId]
          }
          return nodes
        }) // setNodeData


      }) // Successful post
      .catch((err) => {
        // Error status should only happen if the server is down
        // Request is VERY malformed or there is a bug in the server.
        toast.error("Unable to save changes. This shouldn't happen.")
        console.log('ERROR', err)
      })
      .finally(() => {
        setLoading(false)
      })

  }, [newNodes, changes, query, projectName]) // commit

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
  const canCommit = !isEmpty(changes) || newNodes.length

  const addNode = (entityType, root) => {
    const parents = root ? [null] : futureParents

    if (!parents.length) {
      console.log('Nothing to add')
      return
    }

    if (!root) {
      // Adding children to existing nodes, so
      // ensure the parents are not leaves
      setNodeData((nodeData) => {
        for (const parentId of parents) nodeData[parentId].leaf = false
        return nodeData
      })
    }

    setNewNodes((nodes) => {
      let i = 0
      let newNodes = []
      for (const parentId of parents) {
        const id = `newnode${nodes.length + i}`
        const newNode = {
          id,
          attrib: { ...(nodeData[parentId]?.data.attrib || {}) },
          ownAttrib: [],
          __entityType: entityType,
          __parentId: parentId || 'root',
        }
        if (entityType === 'folder') newNode['parentId'] = parentId
        else if (entityType === 'task') {
          newNode['folderId'] = parentId
          newNode['taskType'] = 'Generic'
        }
        newNodes.push(newNode)
        i++
      }
      console.log('ADDING', newNodes)
      return [...nodes, ...newNodes]
    })

    if (!root) {
      // Update expanded folders context object
      const exps = { ...context.expandedFolders }
      for (const id of parents) exps[id] = true
      dispatch(setExpandedFolders(exps))
    }
  } // Add node

  //
  // Other user events handlers (Toolbar)
  //

  const onDelete = () => {
    // Mark the current selection for deletion.
    setNewNodes((newNodes) => {
      return newNodes.filter((node) => !(node.id in currentSelection))
    })

    setChanges((changes) => {
      for (const id in currentSelection) {
        if (id.startsWith('newnode')) continue
        changes[id] = changes[id] || {
          __entityType: nodeData[id].data.__entityType,
          __parentId: nodeData[id].data.__parentId,
        }
        changes[id].__action = 'delete'
      }
      return changes
    })
  }

  const onRevert = () => {
    setChanges({})
    setNewNodes([])
  }

  const revertChangesOnSelection = useCallback(() => {
    const modifiedIds = Object.keys(changes).filter(
      (i) => i in currentSelection
    )
    const newIds = newNodes
      .map((i) => i.id)
      .filter((i) => i in currentSelection)

    setNewNodes((nodes) => {
      return nodes.filter((i) => !newIds.includes(i.id))
    })
    setChanges((nodes) => {
      const result = {}
      for (const id in nodes) {
        if (!modifiedIds.includes(id)) result[id] = nodes[id]
      }
      return result
    })
  }, [currentSelection, changes, newNodes])

  const onAddFolder = () => addNode('folder')
  const onAddRootFolder = () => addNode('folder', true)
  const onAddTask = () => addNode('task')

  // Context menu

  const onContextMenuSelectionChange = (event) => {
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

  const onToggle = (event) => {
    dispatch(setExpandedFolders(event.value))
  }

  const onSelectionChange = (event) => {
    if (selectionLocked) return
    dispatch(setFocusedFolders(Object.keys(event.value)))
  }

  const onRowClick = (event) => {
    const node = event.node.data
    if (node.__entityType !== 'folder') return
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
    <main>
      <Section>
        <Toolbar>
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
          <Button label="Delete selected" icon="delete" onClick={onDelete} />
          <InputSwitch
            checked={selectionLocked}
            onChange={() => setSelectionLocked(!selectionLocked)}
            style={{ width: 40, marginLeft: 10 }}
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
        </Toolbar>
        <Panel className="nopad">
          <TableWrapper>
            {loading && <Shade />}
            <ContextMenu model={contextMenuModel} ref={contextMenuRef} />
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
                    rowData.key in changes &&
                    changes[rowData.key]?.__action == 'delete',
                }
              }}
              selectOnEdit={false}
              onContextMenu={(e) =>
                contextMenuRef.current.show(e.originalEvent)
              }
              onContextMenuSelectionChange={onContextMenuSelectionChange}
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
                    body={(rowData) =>
                      formatAttribute(rowData.data, changes, col.name)
                    }
                    editor={(options) => {
                      return col.editor(
                        options,
                        updateAttribute,
                        formatAttribute(
                          options.rowData,
                          changes,
                          col.name,
                          false
                        )
                      )
                    }}
                  />
                )
              })}
              <Column
                field="error"
                header=""
                body={(rowData) => formatError(rowData.data)}
                style={{ width: 24 }}
              />
            </TreeTable>
          </TableWrapper>
        </Panel>
      </Section>
    </main>
  )
}

export default EditorPage
