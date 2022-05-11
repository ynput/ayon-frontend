import { useState, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'

import axios from 'axios'

import { InputText } from 'primereact/inputtext'
import { Column } from 'primereact/column'
import { TreeTable } from 'primereact/treetable'
import { MultiSelect } from 'primereact/multiselect'

import { Shade } from '../../components'
import { CellWithIcon } from '../../components/icons'

import { setFocusedFolders, setBreadcrumbs } from '../../features/context'
import { getFolderTypeIcon } from '../../utils'




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
          body: (<CellWithIcon 
            icon={getFolderTypeIcon(item.folderType)}
            text={item.name}
          />)
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
            body: (<CellWithIcon 
              icon={getFolderTypeIcon(item.folderType)}
              text={item.name}
            />)
          },
        })
      }
    }
  }
  return result
}

const Hierarchy = ({ projectName, folderTypes, focusedFolders }) => {
  const dispatch = useDispatch()
  const [query, setQuery] = useState('')
  const [selectedFolderTypes, setSelectedFolderTypes] = useState([])
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

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
    for (const tid of focusedFolders) 
      r[tid] = true
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

  //
  // Folder types
  //
  
  // Transform a list of folder types to a list of objects
  // compatible with the MultiSelect component

  const folderTypeList = useMemo(() => {
    if (!folderTypes) return []
    let nlist = []
    for (let folderType in folderTypes) {
      nlist.push({
        value: folderType,
        label: folderType,
      })
    }
    return nlist
  }, [folderTypes])

  // Custom "selected folder type" render template for the multiselect
  // component

  const selectedTypeTemplate = (option) => {
    if (option) {
      const folder_type_label = option ? option.replace(/[a-z]/g, '') : '??'
      return <span style={{ marginRight: '10px' }}>{folder_type_label}</span>
    }
    return 'Folder types'
  }

  //
  // Render
  //

  return (
    <section className="invisible insplit">
      <section className="invisible row">
        <span className="p-input-icon-left" style={{ flexGrow: 1 }}>
          <i className="pi pi-search" />
          <InputText
            style={{ width: '100%' }}
            placeholder="Filter folders..."
            disabled={!projectName || loading}
            value={query}
            onChange={(evt) => setQuery(evt.target.value)}
          />
        </span>

        <MultiSelect
          value={selectedFolderTypes}
          options={folderTypeList}
          placeholder="Select folder types"
          showClear={true}
          optionLabel="label"
          disabled={!projectName || loading}
          selectedItemTemplate={selectedTypeTemplate}
          onChange={(e) => setSelectedFolderTypes(e.value)}
          style={{
            flexBasis: '40%',
          }}
        />
      </section>

      <section style={{ flexGrow: 1 }}>
        <div className="wrapper">
          {loading && <Shade />}
          <TreeTable
            value={treeData}
            responsive="true"
            scrollable
            scrollHeight="100%"
            selectionMode="multiple"
            selectionKeys={selectedFolders}
            emptyMessage=" "
            onSelectionChange={onSelectionChange}
            onRowClick={onRowClick}
          >
            <Column
              header="Hierarchy"
              field="body"
              expander={true}
              style={{ width: '100%' }}
            />
          </TreeTable>
        </div>
      </section>
    </section>
  )
}

export default Hierarchy
