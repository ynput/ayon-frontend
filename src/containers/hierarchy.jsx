import axios from 'axios'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import {
  Shade,
  Section,
  Panel,
  Toolbar,
  InputText,
  TablePanel,
} from 'openpype-components'

import { Column } from 'primereact/column'
import { TreeTable } from 'primereact/treetable'
import { MultiSelect } from 'primereact/multiselect'
import { ContextMenu } from 'primereact/contextmenu'

import { CellWithIcon } from '/src/components/icons'
import EntityDetail from '/src/containers/entityDetail'

import {
  setFocusedFolders,
  setBreadcrumbs,
  setExpandedFolders,
  setEditTags,
} from '/src/features/context'
import { getFolderTypeIcon } from '/src//utils'

const filterHierarchy = (text, folder) => {
  /*
    Filter the hierarchy using a given text and rename "id" to "key"
    and "name" to "label", which is needed to render the hierarchy
    using primereact tree
    */
  let result = []
  if (!folder) return []
  for (const item of folder) {
    if (
      item.name &&
      (!text || item.name.toLowerCase().includes(text.toLowerCase()))
    ) {
      const newChildren = filterHierarchy(false, item.children)
      result.push({
        key: item.id,
        children: newChildren,
        data: {
          name: item.name,
          folderType: item.folderType,
          hasSubsets: item.hasSubsets,
          hasTasks: item.hasTasks,
          parents: item.parents,
          body: (
            <CellWithIcon
              icon={getFolderTypeIcon(item.folderType)}
              text={item.name}
            />
          ),
        },
      })
    } else if (item.children) {
      const newChildren = filterHierarchy(text, item.children)
      if (newChildren.length > 0) {
        result.push({
          key: item.id,
          children: newChildren,
          data: {
            name: item.name,
            folderType: item.folderType,
            hasSubsets: item.hasSubsets,
            hasTasks: item.hasTasks,
            parents: item.parents,
            body: (
              <CellWithIcon
                icon={getFolderTypeIcon(item.folderType)}
                text={item.name}
              />
            ),
          },
        })
      }
    }
  }
  return result
}

const Hierarchy = (props) => {
  const context = useSelector((state) => ({ ...state.context }))
  const projectName = context.projectName
  const folderTypes = context.project.folderTypes
  const expandedFolders = context.expandedFolders
  const focusedFolders = context.focusedFolders

  const dispatch = useDispatch()
  const [query, setQuery] = useState('')
  const [selectedFolderTypes, setSelectedFolderTypes] = useState([])
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const ctxMenuRef = useRef(null)
  const [showDetail, setShowDetail] = useState(false)

  //
  // Hooks
  //

  // Fetch the hierarchy data from the server, when the project changes
  // or when user changes the folder types to be displayed

  useEffect(() => {
    setLoading(true)
    let url = `/api/projects/${projectName}/hierarchy`

    //TODO: use axios params here
    if (selectedFolderTypes) url += `?types=${selectedFolderTypes.join(',')}`

    axios
      .get(url)
      .then((response) => {
        setData(response.data.hierarchy)
      })
      .catch((error) => {
        const errMessage =
          error.response.data.detail || `Error ${error.response.status}`
        toast.error(`Unable to load hierarchy. ${errMessage}`)
      })
      .finally(() => {
        setLoading(false)
      })
    // eslint-disable-next-line
  }, [projectName, selectedFolderTypes])

  // We already have the data, so we can do the client-side filtering
  // and tree transformation

  const treeData = useMemo(() => {
    if (!data) return []
    return filterHierarchy(query, data)
  }, [data, query])

  //
  // Selection
  //

  // Transform the plain list of focused folder ids to a map
  // {id: true}, which is needed for the Treetable

  const selectedFolders = useMemo(() => {
    if (!focusedFolders) return []
    const r = {}
    for (const tid of focusedFolders) r[tid] = true
    return r
  }, [focusedFolders])

  // Set breadcrumbs on row click (the latest selected folder,
  // will be the one that is displayed in the breadcrumbs)

  const onRowClick = (event) => {
    const node = event.node.data
    dispatch(
      setBreadcrumbs({
        parents: node.parents,
        folder: node.name,
      })
    )
  }

  // Update the folder selection in the project context

  const onSelectionChange = (event) => {
    const selection = Object.keys(event.value)
    dispatch(setFocusedFolders(selection))
  }

  const onContextMenuSelectionChange = (event) => {
    if (focusedFolders.includes(event.value)) return
    dispatch(setFocusedFolders([event.value]))
  }

  const onToggle = (event) => {
    dispatch(setExpandedFolders(event.value))
  }

  //
  // Folder types
  //

  // Transform a list of folder types to a list of objects
  // compatible with the MultiSelect component

  const folderTypeList = folderTypes.map((e) => ({
    label: e.name,
    value: e.name,
  }))

  // Custom "selected folder type" render template for the multiselect
  // component

  const selectedTypeTemplate = (option) => {
    if (option) {
      const folder_type_label = option ? option.replace(/[a-z]/g, '') : '??'
      return <span style={{ marginRight: '10px' }}>{folder_type_label}</span>
    }
    return 'Folder types'
  }

  const ctxMenuModel = [
    {
      label: 'Detail',
      command: () => setShowDetail(true),
      disabled: focusedFolders.length !== 1,
    },
    {
      label: 'Edit Tags',
      command: () => dispatch(setEditTags(true)),
      disabled: focusedFolders.length !== 1,
    },
  ]

  //
  // Render
  //

  return (
    <Section style={props.style}>
      <Toolbar>
        <InputText
          style={{ flexGrow: 1, minWidth: 100 }}
          placeholder="Filter folders..."
          disabled={!projectName || loading}
          value={query}
          onChange={(evt) => setQuery(evt.target.value)}
        />

        <MultiSelect
          value={selectedFolderTypes}
          options={folderTypeList}
          placeholder="Select folder types"
          showClear={true}
          optionLabel="label"
          disabled={!projectName || loading}
          selectedItemTemplate={selectedTypeTemplate}
          onChange={(e) => setSelectedFolderTypes(e.value)}
          style={{ flexBasis: 150 }}
        />
      </Toolbar>

      <TablePanel loading={loading}>
        <ContextMenu model={ctxMenuModel} ref={ctxMenuRef} />
        <EntityDetail
          projectName={projectName}
          entityType="folder"
          entityId={focusedFolders[0]}
          visible={showDetail}
          onHide={() => setShowDetail(false)}
        />
        <TreeTable
          value={treeData}
          responsive="true"
          scrollable
          scrollHeight="100%"
          selectionMode="multiple"
          selectionKeys={selectedFolders}
          expandedKeys={expandedFolders}
          emptyMessage=" "
          onSelectionChange={onSelectionChange}
          onToggle={onToggle}
          onRowClick={onRowClick}
          onContextMenu={(e) => ctxMenuRef.current?.show(e.originalEvent)}
          onContextMenuSelectionChange={onContextMenuSelectionChange}
        >
          <Column
            header="Hierarchy"
            field="body"
            expander={true}
            style={{ width: '100%' }}
          />
        </TreeTable>
      </TablePanel>
    </Section>
  )
}

export default Hierarchy
