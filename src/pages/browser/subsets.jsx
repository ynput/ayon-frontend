import { useState, useEffect, useMemo, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { InputText, TablePanel, Section, Toolbar } from '@ynput/ayon-react-components'
import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'
import { ContextMenu } from 'primereact/contextmenu'
import EntityDetail from '/src/containers/entityDetail'
import { CellWithIcon } from '/src/components/icons'
import { TimestampField } from '/src/containers/fieldFormat'
import usePubSub from '/src/hooks/usePubSub'

import { groupResult, getFamilyIcon, useLocalStorage } from '/src/utils'
import {
  setFocusedVersions,
  setFocusedSubsets,
  setSelectedVersions,
  setBreadcrumbs,
  setPairing,
  setDialog,
} from '/src/features/context'
import { VersionList } from './subsetsUtils'
import StatusSelect from '../../components/status/statusSelect'
import { useGetSubsetsListQuery, useUpdateSubsetsMutation } from '../../services/ayon'
import { MultiSelect } from 'primereact/multiselect'

const Subsets = () => {
  const dispatch = useDispatch()
  const context = useSelector((state) => ({ ...state.context }))

  const projectName = context.projectName
  const focusedVersions = context.focused.versions
  const focusedFolders = context.focused.folders
  const selectedVersions = context.selectedVersions
  const focusedSubsets = context.focused.subsets
  const pairing = context.pairing

  const ctxMenuRef = useRef(null)
  const [showDetail, setShowDetail] = useState(false) // false or 'subset' or 'version'
  // sets size of status based on status column width
  const [columnsWidths, setColumnWidths] = useLocalStorage('subsets-columns-widths', {})

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

  const {
    data: subsetData = [],
    isLoading: loading,
    refetch,
  } = useGetSubsetsListQuery(
    {
      ids: focusedFolders,
      projectName,
      versionOverrides,
    },
    { skip: !focusedFolders.length },
  )

  // PUBSUB HOOK
  usePubSub(
    'entity.subset',
    refetch,
    subsetData.map(({ id }) => id),
  )

  // PATCH FOLDERS DATA
  const [updateSubsets] = useUpdateSubsetsMutation()

  // update subset status
  const handleStatusChange = async (value, selectedId) => {
    try {
      // get selected ids
      let ids = focusedSubsets.includes(selectedId) ? focusedSubsets : [selectedId]

      // delete outdated subsets and push new ones to state
      const patches = [...subsetData].map((data) =>
        ids.includes(data.id) ? { ...data, status: value } : data,
      )

      // need to give versionOverrides for optimistic updates
      const payload = await updateSubsets({
        projectName,
        data: { status: value },
        patches,
        ids,
        focusedFolders,
        versionOverrides,
      }).unwrap()

      console.log('fulfilled', payload)
    } catch (error) {
      console.error('rejected', error)
    }
  }

  const handleStatusOpen = (id) => {
    // handles the edge case where the use foccusess multiple subsets but then changes a different status
    if (!focusedSubsets.includes(id)) {
      // not in focused selection
      // reset selection to status id
      dispatch(setFocusedSubsets([id]))
    }
  }

  let columns = [
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
      style: { overflow: 'visible' },
      body: (node) => {
        if (node.data.isGroup) return ''
        const statusMaxWidth = 120
        return (
          <StatusSelect
            value={node.data.status}
            statuses={context.project.statuses}
            size={
              columnsWidths['status'] < statusMaxWidth
                ? columnsWidths['status'] < 60
                  ? 'icon'
                  : 'short'
                : 'full'
            }
            onChange={(v) => handleStatusChange(v, node.data.id)}
            maxWidth="100%"
            multipleSelected={focusedSubsets.length}
            onClick={() => handleStatusOpen(node.data.id)}
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
          // TODO changing version doesn't auto update version detail
          let newSelection = { ...selectedVersions[node.data.folderId] }
          newSelection[subsetId] = versionId
          dispatch(
            setSelectedVersions({
              ...selectedVersions,
              [node.data.folderId]: newSelection,
            }),
          )
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

  const filterOptions = columns.map(({ field }) => ({ value: field, label: field }))
  const allColumnsNames = filterOptions.map(({ value }) => value)
  const isMultiSelected = focusedFolders.length > 1

  const [shownColumnsSingleFocused, setShownColumnsSingleFocused] = useLocalStorage(
    'subsets-columns-filter-single',
    allColumnsNames,
  )
  const [shownColumnsMultiFocused, setShownColumnsMultiFocused] = useLocalStorage(
    'subsets-columns-filter-multi',
    allColumnsNames,
  )

  const handleColumnsFilter = (e) => {
    e.preventDefault()
    const newArray = e.target.value || []

    if (newArray.length) {
      // make sure there's always at least one column
      isMultiSelected
        ? setShownColumnsMultiFocused(newArray)
        : setShownColumnsSingleFocused(newArray)
    }
  }

  // sort columns if localstorage set
  let columnsOrder = localStorage.getItem('subsets-columns-order')
  if (columnsOrder) {
    try {
      columnsOrder = JSON.parse(columnsOrder)
      columns.sort((a, b) => columnsOrder[a.field] - columnsOrder[b.field])
    } catch (error) {
      console.log(error)
      // remove local stage
      localStorage.removeItem('subsets-columns-order')
    }
  }

  const shownColumns = isMultiSelected ? shownColumnsMultiFocused : shownColumnsSingleFocused

  // only filter columns if required
  if (shownColumns.length < columns.length) {
    columns = columns.filter(({ field }) => shownColumns.includes(field))
  }

  const handleColumnReorder = (e) => {
    const localStorageOrder = e.columns.reduce(
      (acc, cur, i) => ({ ...acc, [cur.props.field]: i }),
      {},
    )

    localStorage.setItem('subsets-columns-order', JSON.stringify(localStorageOrder))
  }

  const handleColumnResize = (e) => {
    const key = 'subsets-columns-widths'
    const field = e.column.props.field
    const width = e.element.offsetWidth

    // set localstorage for column size change
    let oldWidthState = {}
    if (localStorage.getItem(key)) {
      oldWidthState = JSON.parse(localStorage.getItem(key))
    }

    const newWidthState = { ...oldWidthState, [field]: width }

    setColumnWidths(newWidthState)
  }

  // update status width

  //
  // Hooks
  //

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
        <MultiSelect
          options={filterOptions}
          value={shownColumns}
          onChange={handleColumnsFilter}
          placeholder={`Show Columns (${focusedFolders.length > 1 ? 'Multiple' : 'Single'})`}
          fixedPlaceholder={shownColumns.length + 1 >= filterOptions.length}
        />
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
          onColumnResizeEnd={handleColumnResize}
          reorderableColumns
          onColReorder={handleColumnReorder}
        >
          {columns.map((col, i) => {
            return (
              <Column
                key={col.field}
                style={{ ...col.style, width: columnsWidths[col.field] || col.width }}
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
