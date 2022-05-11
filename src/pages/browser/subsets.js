import { useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { DateTime } from 'luxon'

import axios from 'axios'

import { InputText, Spacer, Button, Shade } from '../../components'
import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'

import {
  setFocusedVersions,
  setSelectedVersions,
  setBreadcrumbs,
  setPairing,
} from '../../features/context'
import { groupResult } from '../../utils'

import { SUBSET_QUERY, parseSubsetData, VersionList } from './subset-utils'


const CellWithIcon = ({ icon, iconClassName, text }) => {
  return (
    <>
    <span 
      className={`material-symbols-outlined ${iconClassName || ''}`} 
      style={{ 
        display: "inline",
        fontSize: '1.3rem', 
        marginRight: '0.5rem',
        verticalAlign: 'text-top',
      }}
    > 
      {icon}
    </span>
    {text}
    </>
  )
}


const Subsets = ({
  projectName,
  folders,
  focusedVersions,
  selectedVersions,
}) => {
  const dispatch = useDispatch()
  const pairing = useSelector(state => state.context.pairing)
  const [subsetData, setSubsetData] = useState([])
  const [loading, setLoading] = useState(false)
  const [focusOnReload, setFocusOnReload] = useState(null)


  // Columns definition
  // It must be here since we are referencing the component state and the context :-(
  

  const columns = [
    {
      field: 'name',
      header: 'Subset',
      width: 200,
      body: (node) => {

        let className = ''
        let i = 0
        for (const pair of pairing) {
          i++
          if (pair.taskId === node.data.taskId) {
            className = `row-hl-${i}`
            break
          }
        }

        let icon = 'dataset'
        if (node.data.isGroup)
          icon = "folder"
        else if (node.data.taskId)
          icon = "settings"


        return <CellWithIcon icon={icon} iconClassName={className} text={node.data.name} />
      }
    },
    {
      field: 'folder',
      header: 'Folder',
      width: 200,
    },
    {
      field: 'family',
      header: 'Family',
      width: 120,
    },
    {
      field: 'versionList',
      header: 'Version',
      width: 70,
      body: (node) => VersionList(node.data, (subsetId, versionId) => {
          let newSelection = {...selectedVersions[node.data.folderId] }
          newSelection[subsetId] = versionId
          dispatch(
            setSelectedVersions({
              ...selectedVersions,
              [node.data.folderId]: newSelection,
            })
          )
          setFocusOnReload(versionId)
        }) // end VersionList
    },
    {
      field: 'time',
      header: 'Time',
      width: 150,
      body: (node) => node.data.createdAt && DateTime.fromSeconds(node.data.createdAt).toRelative()
    },
    {
      field: 'author',
      header: 'Author',
      width: 120,
    },
    {
      field: 'frames',
      header: 'Frames',
      width: 120,
    },
  ]

  //
  // Hooks
  //
    
  // Load the subsets/versions data from the server

  useEffect(() => {
    if (folders.length === 0) return

    // version overrides
    // Get a list of version overrides for the current set of folders
    let versionOverrides = []
    for (const folderId of folders) {
      const c = selectedVersions[folderId]
      if (!c) continue
      for (const subsetId in c) {
        const versionId = c[subsetId]
        if (versionOverrides.includes(versionId)) continue
        versionOverrides.push(versionId)
      }
    }
    if (versionOverrides.length === 0) {
      // We need at least one item in the array to filter.
      versionOverrides = ['00000000000000000000000000000000']
    }

    setLoading(true)
    axios
      .post('/graphql', {
        query: SUBSET_QUERY,
        variables: { folders, projectName, versionOverrides },
      })
      .then((response) => {
        if (!(response.data.data && response.data.data.project)) {
          toast.error('Unable to fetch subsets')
          return
        }
        setSubsetData(parseSubsetData(response.data.data))
      })
      .finally(() => {
        setLoading(false)
        if (focusOnReload) {
          dispatch(setFocusedVersions([focusOnReload]))
          setFocusOnReload(null)
        }
      })
    // eslint-disable-next-line
  }, [folders, projectName, selectedVersions])
    

  // Parse focusedVersions list from the project context
  // and create a list of selected subset rows compatible
  // with the TreeTable component

  const selectedRows = useMemo(() => {
    if (focusedVersions.length === 0) return []
    const subsetIds = {}
    const pairs = []
    for (const sdata of subsetData) {
      if (focusedVersions.includes(sdata.versionId)) {
        subsetIds[sdata.id] = true

        if (sdata.taskId) {
          pairs.push({
            taskId: sdata.taskId,
            folderId: sdata.folderId,
            versionId: sdata.versionId,
          })
        }
      }
    }
    dispatch(setPairing(pairs))
    return subsetIds
  }, [subsetData, focusedVersions])
  
  // Transform the subset data into a TreeTable compatible format
  // by grouping the data by the subset name

  const tableData = useMemo(() => {
    return groupResult(subsetData, "name")
  }, [subsetData])

  //
  // Handlers
  //

  // Set the breadcrumbs when a row is clicked
  const onRowClick = (event) => {
    dispatch(
      setBreadcrumbs({
        parents: event.node.parents,
        folder: event.node.folder,
        subset: event.node.name,
        version: event.node.versionName,
      })
    )
  }

  const onSelectionChange = (event) => {
    let result = []
    const selection = Object.keys(event.value)
    for (const sdata of subsetData) {
      if (selection.includes(sdata.id)) {
        result.push(sdata.versionId)
      }
    }
    dispatch(setFocusedVersions(result))
  }

  //
  // Render
  //

  return (
    <section className="invisible insplit">
      <section className="invisible row">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            style={{ width: '200px' }}
            placeholder="Filter subsets..."
            disabled={true}
          />
        </span>
        <Button
          icon="pi pi-list"
          tooltip="Mockup button"
          disabled={true}
          tooltipOptions={{ position: 'bottom' }}
        />
        <Button
          icon="pi pi-th-large"
          tooltip="Mockup button"
          disabled={true}
          tooltipOptions={{ position: 'bottom' }}
        />
        <Spacer />
      </section>

      <section
        style={{
          flexGrow: 1,
          padding: 0,
        }}
      >
        <div className="wrapper">
          {loading && <Shade />}
          <TreeTable
            scrollable
            responsive="true"
            resizableColumns
            columnResizeMode="expand"
            scrollHeight="flex"
            value={tableData}
            emptyMessage="No subset found"
            selectionMode="multiple"
            selectionKeys={selectedRows}
            onSelectionChange={onSelectionChange}
            onRowClick={onRowClick}
          >
            {columns.map((col, i) => {
              return (
                <Column {...col} key={col.field} style={{ width: col.width }} expander={i === 0}/>
              )
            })}
          </TreeTable>
        </div>
      </section>
    </section>
  )
}

export default Subsets
