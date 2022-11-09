import { useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { DateTime } from 'luxon'

import axios from 'axios'

import {
  InputText,
  Spacer,
  Shade,
  Button,
  TableWrapper,
  Section,
  Toolbar,
  Panel,
} from 'openpype-components'
import { CellWithIcon } from '/src/components/icons'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'

import { groupResult, getFamilyIcon } from '/src/utils'
import {
  setFocusedVersions,
  setSelectedVersions,
  setBreadcrumbs,
  setPairing,
} from '/src/features/context'

import { SUBSET_QUERY, parseSubsetData, VersionList } from './subsetsUtils'

const Subsets = ({
  projectName,
  folders,
  focusedVersions,
  selectedVersions,
}) => {
  const dispatch = useDispatch()
  const pairing = useSelector((state) => state.context.pairing)
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

        const icon = node.data.isGroup
          ? 'folder'
          : getFamilyIcon(node.data.family)

        return (
          <CellWithIcon
            icon={icon}
            iconClassName={className}
            text={node.data.name}
          />
        )
      },
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
      body: (node) =>
        VersionList(node.data, (subsetId, versionId) => {
          let newSelection = { ...selectedVersions[node.data.folderId] }
          newSelection[subsetId] = versionId
          dispatch(
            setSelectedVersions({
              ...selectedVersions,
              [node.data.folderId]: newSelection,
            })
          )
          setFocusOnReload(versionId)
        }), // end VersionList
    },
    {
      field: 'time',
      header: 'Time',
      width: 150,
      body: (node) =>
        node.data.createdAt &&
        DateTime.fromSeconds(node.data.createdAt).toRelative(),
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
    for (const sdata of subsetData) {
      if (focusedVersions.includes(sdata.versionId)) {
        subsetIds[sdata.id] = true
      }
    }
    return subsetIds
  }, [subsetData, focusedVersions])

  // Since using dispatch in useMemo causes errors,
  // we need to use useEffect to update task-version pairing
  // in the context

  useEffect(() => {
    if (!focusedVersions.length) return
    const pairs = []
    for (const sdata of subsetData) {
      if (focusedVersions.includes(sdata.versionId)) {
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
    // shut up about missing dispatch dependency
    // eslint-disable-next-line
  }, [subsetData, focusedVersions])

  // Transform the subset data into a TreeTable compatible format
  // by grouping the data by the subset name

  const tableData = useMemo(() => {
    return groupResult(subsetData, 'name')
  }, [subsetData])

  //
  // Handlers
  //

  // Set the breadcrumbs when a row is clicked
  const onRowClick = (event) => {
    if (event.node.data.isGroup) {
      return
    }

    dispatch(
      setBreadcrumbs({
        parents: event.node.data.parents,
        folder: event.node.data.folder,
        subset: event.node.data.name,
        version: event.node.data.versionName,
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
    <Section className="wrap">
      <Toolbar>
        <InputText style={{ width: '200px' }} placeholder="Filter subsets..." />
      </Toolbar>

      <Panel className="nopad">
        <TableWrapper>
          {loading && <Shade />}
          <TreeTable
            responsive="true"
            scrollHeight="100%"
            scrollable="true"
            resizableColumns
            columnResizeMode="expand"
            value={tableData}
            emptyMessage="No subset found"
            selectionMode="multiple"
            selectionKeys={selectedRows}
            onSelectionChange={onSelectionChange}
            onRowClick={onRowClick}
          >
            {columns.map((col, i) => {
              return (
                <Column
                  {...col}
                  key={col.field}
                  style={{ width: col.width }}
                  expander={i === 0}
                  resizeable={true}
                />
              )
            })}
          </TreeTable>
        </TableWrapper>
      </Panel>
    </Section>
  )
}

export default Subsets
