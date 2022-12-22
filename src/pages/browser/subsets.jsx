import { useState, useEffect, useMemo, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'

import axios from 'axios'

import { InputText, TablePanel, Section, Toolbar } from '@ynput/ayon-react-components'

import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'
import { ContextMenu } from 'primereact/contextmenu'

import EntityDetail from '/src/containers/entityDetail'
import { CellWithIcon } from '/src/components/icons'
import { TimestampField } from '/src/containers/fieldFormat'

import { groupResult, getFamilyIcon } from '/src/utils'
import {
  setFocusedVersions,
  setFocusedSubsets,
  setSelectedVersions,
  setBreadcrumbs,
  setPairing,
  setDialog,
} from '/src/features/context'

import { SUBSET_QUERY, parseSubsetData, VersionList } from './subsetsUtils'
import StatusSelect from '../../components/status/statusSelect'

const Subsets = () => {
  const dispatch = useDispatch()
  const context = useSelector((state) => ({ ...state.context }))

  const projectName = context.projectName
  const focusedVersions = context.focused.versions
  const focusedFolders = context.focused.folders
  const selectedVersions = context.selectedVersions
  const focusedSubsets = context.focused.subsets
  const pairing = context.pairing

  const [subsetData, setSubsetData] = useState([])
  const [loading, setLoading] = useState(false)
  const [focusOnReload, setFocusOnReload] = useState(null)
  const ctxMenuRef = useRef(null)
  const [showDetail, setShowDetail] = useState(false) // false or 'subset' or 'version'

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

        const icon = node.data.isGroup ? 'folder' : getFamilyIcon(node.data.family)

        return <CellWithIcon icon={icon} iconClassName={className} text={node.data.name} />
      },
    },
    {
      field: 'status',
      header: 'Status',
      width: 150,
      style: { overflow: 'visible', padding: '10px !important' },
      body: (node) => {
        if (node.data.isGroup) return ''
        return (
          <StatusSelect value={node.data.status} statuses={context.project.statuses} width={150} />
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
            }),
          )
          setFocusOnReload(versionId)
        }), // end VersionList
    },
    {
      field: 'time',
      header: 'Time',
      width: 150,
      body: (node) => node.data.createdAt && <TimestampField value={node.data.createdAt} />,
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
    if (focusedFolders?.length === 0) return

    // version overrides
    // Get a list of version overrides for the current set of folders
    let versionOverrides = []
    for (const folderId of focusedFolders) {
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
        variables: { folders: focusedFolders, projectName, versionOverrides },
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
  }, [focusedFolders, projectName, selectedVersions])

  // Parse focusedVersions list from the project context
  // and create a list of selected subset rows compatible
  // with the TreeTable component

  const selectedRows = useMemo(() => {
    if (focusedVersions?.length === 0) return []
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
      }),
    )
  }

  const onSelectionChange = (event) => {
    let result = []
    let subsets = []
    const selection = Object.keys(event.value)
    for (const sdata of subsetData) {
      if (selection.includes(sdata.id)) {
        result.push(sdata.versionId)
        subsets.push(sdata.id)
      }
    }
    // we need to set the focused versions first
    // otherwise setFocusedSubsets will clear the selection
    // of versions.
    dispatch(setFocusedSubsets(subsets))
    dispatch(setFocusedVersions(result))
  }

  const onContextMenuSelectionChange = (event) => {
    if (focusedSubsets.includes(event.value)) return
    const subsetId = event.value
    const versionId = subsetData.find((s) => s.id === subsetId).versionId
    dispatch(setFocusedSubsets([subsetId]))
    dispatch(setFocusedVersions([versionId]))
  }

  const ctxMenuModel = [
    {
      label: 'Subset detail',
      command: () => setShowDetail('subset'),
      disabled: focusedSubsets.length !== 1,
    },
    {
      label: 'Version detail',
      command: () => setShowDetail('version'),
      disabled: focusedVersions.length !== 1,
    },
    {
      label: 'Edit Version Tags',
      command: () =>
        dispatch(
          setDialog({
            type: 'tags',
          }),
        ),
    },
  ]

  //
  // Render
  //

  return (
    <Section className="wrap">
      <Toolbar>
        <InputText style={{ width: '200px' }} placeholder="Filter subsets..." />
      </Toolbar>

      <TablePanel loading={loading}>
        <ContextMenu model={ctxMenuModel} ref={ctxMenuRef} />
        <EntityDetail
          projectName={projectName}
          entityType={showDetail}
          entityId={showDetail === 'subset' ? focusedSubsets[0] : focusedVersions[0]}
          visible={showDetail}
          onHide={() => setShowDetail(false)}
        />
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
          onContextMenu={(e) => ctxMenuRef.current?.show(e.originalEvent)}
          onContextMenuSelectionChange={onContextMenuSelectionChange}
        >
          {columns.map((col, i) => {
            return (
              <Column
                key={col.field}
                style={{ ...col.style, width: col.width }}
                expander={i === 0}
                resizeable={true}
                field={col.field}
                header={col.header}
                body={col.body}
                className={col.field}
              />
            )
          })}
        </TreeTable>
      </TablePanel>
    </Section>
  )
}

export default Subsets
