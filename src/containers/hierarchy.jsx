import { useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { Section, Toolbar, InputText, TablePanel } from '@ynput/ayon-react-components'

import { Column } from 'primereact/column'
import { TreeTable } from 'primereact/treetable'
import { MultiSelect } from 'primereact/multiselect'

import { CellWithIcon } from '/src/components/icons'
import EntityDetail from '/src/containers/entityDetail'

import {
  setFocusedFolders,
  setUri,
  setExpandedFolders,
  setFocusedTasks,
} from '/src/features/context'
import { useGetProjectFoldersQuery } from '/src/services/getHierarchy'
import useCreateContext from '../hooks/useCreateContext'

const filterHierarchy = (text, folder, folders) => {
  // This is no longer used
  // It is here for the reference how the filtering was implemented.
  let result = []
  if (!folder) return []
  for (const item of folder) {
    if (item.name && (!text || item.name.toLowerCase().includes(text.toLowerCase()))) {
      const newChildren = filterHierarchy(false, item.children, folders)
      result.push({
        key: item.id,
        children: newChildren,
        data: {
          name: item.name,
          label: item.label,
          status: item.status,
          folderType: item.folderType,
          // hasProducts: item.hasProducts,
          hasTasks: item.hasTasks,
          parents: item.parents,
          body: (
            <CellWithIcon
              icon={folders[item.folderType]?.icon}
              text={item.label}
              name={item.name}
            />
          ),
        },
      })
    } else if (item.children) {
      const newChildren = filterHierarchy(text, item.children, folders)
      if (newChildren.length > 0) {
        result.push({
          key: item.id,
          children: newChildren,
          data: {
            name: item.name,
            label: item.label,
            status: item.status,
            folderType: item.folderType,
            // hasProducts: item.hasProducts,
            hasTasks: item.hasTasks,
            parents: item.parents,
            body: (
              <CellWithIcon
                icon={folders[item.folderType]?.icon}
                text={item.label}
                name={item.name}
              />
            ),
          },
        })
      }
    }
  }
  return result
}



const buildTree = (parents, parent, folders) => {
  const items = []
  for (const child of (parents[parent] || [])) {
    if (!child) continue

    const nchild = {
      key: child.id,
      data: {
        name: child.name,
        label: child.label || child.name,
        status: child.status,
        folderType: child.folderType,
        hasTasks: child.hasTasks,
        parents: child.parents,
        body: (
          <CellWithIcon
            icon={folders[child.folderType]?.icon}
            text={child.label}
            name={child.name}
          />
        ),
      }
     
    }
    if (child.id in parents) {
      nchild.children = buildTree(parents, child.id, folders)
    }
    items.push(nchild)
  }
  // return items sorted by item.data.name
  return items.sort((a, b) => a.data.name.localeCompare(b.data.name))
}




const Hierarchy = (props) => {
  const projectName = useSelector((state) => state.project.name)
  const foldersOrder = useSelector((state) => state.project.foldersOrder || [])
  const folders = useSelector((state) => state.project.folders || {})
  const folderTypeList = foldersOrder.map((f) => ({ label: f, value: f }))
  // const focusedType = useSelector((state) => state.context.focused.type)
  const expandedFolders = useSelector((state) => state.context.expandedFolders)
  const focusedFolders = useSelector((state) => state.context.focused.folders)
  const uri = useSelector((state) => state.context.uri)

  const dispatch = useDispatch()
  const [query, setQuery] = useState('')
  const [selectedFolderTypes, setSelectedFolderTypes] = useState([])
  const [showDetail, setShowDetail] = useState(false)

  //
  // Folder types
  //

  // Custom "selected folder type" render template for the multiselect
  // component

  const selectedTypeTemplate = (option) => {
    if (option) {
      const folder_type_label = option ? option.replace(/[a-z]/g, '') : '??'
      return <span style={{ marginRight: '8px' }}>{folder_type_label}</span>
    }
    return 'Folder types'
  }

  // Fetch the hierarchy data from the server, when the project changes
  // or when user changes the folder types to be displayed
  const { isError, error, data, isFetching } = useGetProjectFoldersQuery(
    { projectName },
    { skip: !projectName },
  )

  // Transform the flat data into a tree structure
  const treeData = useMemo(() => {
    if (!data) return []
    const parents = {}
    for (const folder of data) {
      const parentId = folder.parentId
      if (!parents[parentId]) parents[parentId] = []
      parents[parentId].push(folder)
    }
    return buildTree(parents, null, folders)
  }, [data, query])


  // Simple memo to get necessary folder data by folderId
  const keyHelper = useMemo(() => {
    if (!data) return {}
    const result = {}

    for (const folder of data) {
      result[folder.id] = {
        parents: folder.parents,
        hasChildren: folder.hasChildren,
      }
    }
  }, [data])




  //
  // Selection
  //

  // when selection changes programmatically, expand the parent folders
  // runs every time the uri changes
  // useEffect(() => {
  //   if (!focusedFolders?.length) return
  //
  //   let toExpand = [...Object.keys(expandedFolders)]
  //   for (const id of focusedFolders) {
  //     toExpand = toExpand.concat(parents[id])
  //   }
  //   // de-duplicate toExpand and remove null/undefined
  //   toExpand = [...new Set(toExpand)]
  //   toExpand = toExpand.filter((x) => x)
  //
  //   // abort if there's no change
  //   if (toExpand.length === Object.keys(expandedFolders).length) return
  //
  //   //create a map of the expanded folders
  //   const newExpandedFolders = {}
  //   for (const id of toExpand) {
  //     newExpandedFolders[id] = true
  //   }
  //   dispatch(setExpandedFolders(newExpandedFolders))
  // }, [uri])


  // Transform the plain list of focused folder ids to a map
  // {id: true}, which is needed for the Treetable
  const selectedFolders = useMemo(() => {
    if (!focusedFolders) return []
    const r = {}
    for (const tid of focusedFolders) r[tid] = true
    return r
  }, [focusedFolders, isFetching])


  // Set breadcrumbs on row click (the latest selected folder,
  // will be the one that is displayed in the breadcrumbs)
  const onRowClick = (event) => {
    const node = event.node.data
    dispatch(setUri(`ayon+entity://${projectName}/${node.parents.join('/')}/${node.name}`))
  }

  // Update the folder selection in the project context
  const onSelectionChange = (event) => {
    const selection = Object.keys(event.value)
    // remove task selection
    dispatch(setFocusedTasks({ ids: [] }))
    dispatch(setFocusedFolders(selection))

    // for each selected folder, if isLeaf then set expandedFolders
    const newExpandedFolders = {}
    selection.forEach((id) => {
      if (!keyHelper[id].hasChildren) {
        newExpandedFolders[id] = true
      }
    })

    let oldExpandedFolders = { ...expandedFolders }
    // filter out the old expanded folders that are isLeaf
    oldExpandedFolders = Object.fromEntries(
      Object.keys(oldExpandedFolders)
        .filter((id) => !keyHelper[id] || keyHelper[id].hasChildren)
        .map((id) => [id, true]),
    )

    // merge the two
    const mergedExpandedFolders = { ...oldExpandedFolders, ...newExpandedFolders }

    // update redux
    dispatch(setExpandedFolders(mergedExpandedFolders))
  }

  const onContextMenuSelectionChange = (event) => {
    if (focusedFolders.includes(event.value)) return
    dispatch(setFocusedFolders([event.value]))
  }

  const onToggle = (event) => {
    const isMetaKey = event.originalEvent.metaKey || event.originalEvent.ctrlKey
    const newExpandedFolders = event.value
    // what folders have been removed from the expandedFolders
    const removedExpandedFolders = Object.keys(expandedFolders).filter(
      (id) => !newExpandedFolders[id],
    )

    // find ones that are added
    const addedExpandedFolders = Object.keys(newExpandedFolders).filter(
      (id) => !expandedFolders[id],
    )

    // are any removed folders in the focusedFolders?
    const focusedFoldersRemoved = focusedFolders.some((id) => removedExpandedFolders.includes(id))
    if (focusedFoldersRemoved && isMetaKey) {
      // close (remove from expanded) all those folders
      for (const id of focusedFolders) {
        delete newExpandedFolders[id]
      }
    }

    // do you same but for added folders, add them to expandedFolders
    const focusedFoldersAdded = focusedFolders.some((id) => addedExpandedFolders.includes(id))
    if (focusedFoldersAdded && isMetaKey) {
      // add them to expandedFolders
      for (const id of focusedFolders) {
        newExpandedFolders[id] = true
      }
    }

    dispatch(setExpandedFolders(event.value))
  }

  // Context Menu
  // const {openContext, useCreateContext} = useContextMenu()
  // context items
  const contextItems = [
    {
      label: 'Detail',
      command: () => setShowDetail(true),
      icon: 'database',
    },
  ]
  // create the ref and model
  const [ctxMenuShow] = useCreateContext(contextItems)


  // create 10 dummy rows, that will be displayed while loading
  const loadingData = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      key: i,
      data: {},
    }))
  }, [])


  //
  // Render
  //

  const table = useMemo(() => {
    return (
      <TreeTable
        value={treeData || loadingData}
        responsive="true"
        scrollable
        scrollHeight="100%"
        selectionMode="multiple"
        selectionKeys={selectedFolders}
        expandedKeys={expandedFolders}
        emptyMessage={isError && 'No Folders Found'}
        onSelectionChange={onSelectionChange}
        onToggle={onToggle}
        onRowClick={onRowClick}
        onContextMenu={(e) => ctxMenuShow(e.originalEvent)}
        onContextMenuSelectionChange={onContextMenuSelectionChange}
        className={isFetching ? 'table-loading' : undefined}
      >
        <Column header="Hierarchy" field="body" expander={true} style={{ width: '100%' }} />
      </TreeTable>
    )
  }, [treeData, selectedFolders, expandedFolders, isFetching, ctxMenuShow])

  if (isError) {
    toast.error(`Unable to load hierarchy. ${error}`)
  }

  return (
    <Section style={props.style}>
      <Toolbar>
        <InputText
          style={{ flexGrow: 1, minWidth: 100 }}
          placeholder="Filter folders..."
          disabled={!projectName || isFetching}
          value={query}
          onChange={(evt) => setQuery(evt.target.value)}
          autocomplete="off"
        />

        <MultiSelect
          value={selectedFolderTypes}
          options={folderTypeList}
          placeholder="Select folder types"
          showClear={true}
          optionLabel="label"
          disabled={!projectName || isFetching}
          selectedItemTemplate={selectedTypeTemplate}
          onChange={(e) => setSelectedFolderTypes(e.value || [])}
          style={{ flexBasis: 150 }}
        />
      </Toolbar>

      <TablePanel>
        <EntityDetail
          projectName={projectName}
          entityType="folder"
          entityIds={focusedFolders}
          visible={showDetail}
          onHide={() => setShowDetail(false)}
        />

        {table}
      </TablePanel>
    </Section>
  )
}

export default Hierarchy
