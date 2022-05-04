import { useState, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'

import axios from 'axios'

import { InputText } from 'primereact/inputtext'
import { Column } from 'primereact/column'
import { TreeTable } from 'primereact/treetable'
import { MultiSelect } from 'primereact/multiselect'

import { Shade, FolderTypeIcon } from '../../components'

import {
  setFocusedFolders,
  setBreadcrumbs,
  setShowTasks,
} from '../../features/context'

const quickFormat = (name, type) => {
  return (
    <>
      <FolderTypeIcon name={type} />
      <span style={{ marginLeft: 10 }}>{name}</span>
    </>
  )
}

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
          body: quickFormat(item.name, item.folderType),
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
            body: quickFormat(item.name, item.folderType),
          },
        })
      }
    }
  }
  return result
}

const Hierarchy = ({ projectName, folderTypes }) => {
  const dispatch = useDispatch()
  const [query, setQuery] = useState('')
  const [selectedFolderTypes, setSelectedFolderTypes] = useState([])
  const [selectedFolders, setSelectedFolders] = useState({})

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

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

  const loadHierarchy = () => {
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
  }

  const treeData = useMemo(() => {
    if (!data) return []
    return filterHierarchy(query, data)
  }, [data, query])

  useEffect(() => {
    loadHierarchy()
    // eslint-disable-next-line
  }, [projectName, selectedFolderTypes])

  const selectedTypeTemplate = (option) => {
    if (option) {
      const folder_type_label = option ? option.replace(/[a-z]/g, '') : '??'
      return <span style={{ marginRight: '10px' }}>{folder_type_label}</span>
    }
    return 'Folder types'
  }

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

      <section style={{ flexGrow: 1, padding: 0 }}>
        {loading && <Shade />}
        <TreeTable
          value={treeData}
          responsive="true"
          scrollable
          scrollHeight="100%"
          selectionMode="multiple"
          selectionKeys={selectedFolders}
          emptyMessage=" "
          onSelectionChange={(e) => {
            setSelectedFolders(e.value)
            const selection = Object.keys(e.value)
            dispatch(setFocusedFolders(selection))
          }}
          onRowClick={(e) => {
            const node = e.node.data
            dispatch(
              setBreadcrumbs({
                parents: node.parents,
                folder: node.name,
              })
            )

            if (node.hasTasks) {
              dispatch(setShowTasks(e.node.key))
            } else dispatch(setShowTasks(null))
          }}
        >
          <Column
            header="Hierarchy"
            field="body"
            expander={true}
            style={{ width: '100%' }}
          />
        </TreeTable>
      </section>
    </section>
  )
}

export default Hierarchy
