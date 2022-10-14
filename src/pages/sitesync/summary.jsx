import { useState, useEffect } from 'react'

import axios from 'axios'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { MultiSelect } from 'primereact/multiselect'
import { FilterMatchMode } from 'primereact/api'
import { Section, Panel, TableWrapper } from '/src/components'

import { formatStatus, SYNC_STATES } from './common'
import SiteSyncDetail from './detail'

/*
 * Utils
 */

const defaultParams = {
  first: 0,
  rows: 25,
  page: 0,
  sortField: 'folder',
  sortOrder: 1,
  filters: {
    folder: { value: '', matchMode: 'contains' },
    subset: { value: '', matchMode: 'contains' },
    representation: { value: null, matchMode: FilterMatchMode.IN },
    localStatus: { value: null, matchMode: FilterMatchMode.IN },
    remoteStatus: { value: null, matchMode: FilterMatchMode.IN },
  },
}

const textMatchModes = [
  { label: 'Contains', matchMode: FilterMatchMode.CONTAINS },
]
const selectMatchModes = [{ label: 'In', matchMode: FilterMatchMode.IN }]

const buildQueryString = (localSite, remoteSite, lazyParams) => {
  // TODO.... do this less ugly
  let url = `?localSite=${localSite}&remoteSite=${remoteSite}`
  url += `&pageLength=${lazyParams.rows}&page=${lazyParams.page + 1}`
  url += `&sortBy=${lazyParams.sortField}`
  url += `&sortDesc=${lazyParams.sortOrder === 1 ? 'true' : 'false'}`
  if (lazyParams.filters.folder && lazyParams.filters.folder.value)
    url += `&folderFilter=${lazyParams.filters.folder.value}`
  if (lazyParams.filters.subset && lazyParams.filters.subset.value)
    url += `&subsetFilter=${lazyParams.filters.subset.value}`
  if (
    lazyParams.filters.representation &&
    lazyParams.filters.representation.value
  ) {
    for (const val of lazyParams.filters.representation.value)
      url += `&nameFilter=${val}`
  }
  if (lazyParams.filters.localStatus && lazyParams.filters.localStatus.value) {
    for (const val of lazyParams.filters.localStatus.value)
      url += `&localStatusFilter=${val}`
  }
  if (
    lazyParams.filters.remoteStatus &&
    lazyParams.filters.remoteStatus.value
  ) {
    for (const val of lazyParams.filters.remoteStatus.value)
      url += `&remoteStatusFilter=${val}`
  }
  return url
}

/*
 * Main component
 */

const SiteSyncSummary = ({
  projectName,
  localSite,
  remoteSite,
  names,
  totalCount,
}) => {
  const baseUrl = `/api/projects/${projectName}/sitesync/state`
  const [loading, setLoading] = useState(false)
  const [representations, setRepresentations] = useState([])
  const [selectedRepresentation, setSelectedRepresentation] = useState(null)
  const [lazyParams, setLazyParams] = useState(defaultParams)

  useEffect(() => {
    setLoading(true)
    axios
      .get(baseUrl + buildQueryString(localSite, remoteSite, lazyParams))
      .then((response) => {
        setRepresentations(response.data.representations)
      })
      .finally(() => {
        setLoading(false)
      })
    // eslint-disable-next-line
  }, [lazyParams])

  const onPage = (event) => {
    setLazyParams(event)
  }

  const onSort = (event) => {
    event['first'] = 0
    event['page'] = 0
    setLazyParams(event)
  }

  const onFilter = (event) => {
    event['first'] = 0
    event['page'] = 0
    setLazyParams(event)
  }

  const representationFilterTemplate = (options) => {
    return (
      <MultiSelect
        value={options.value}
        options={names}
        onChange={(e) => options.filterApplyCallback(e.value)}
        optionLabel="name"
        placeholder="Any"
        className="p-column-filter"
        maxSelectedLabels={1}
      />
    )
  }

  const statusFilterTemplate = (options) => {
    return (
      <MultiSelect
        value={options.value}
        options={SYNC_STATES}
        onChange={(e) => options.filterApplyCallback(e.value)}
        optionLabel="name"
        placeholder="Any"
        className="p-column-filter"
        maxSelectedLabels={1}
      />
    )
  }

  return (
    <Section>
      {selectedRepresentation && (
        <SiteSyncDetail
          projectName={projectName}
          localSite={localSite}
          remoteSite={remoteSite}
          representationId={selectedRepresentation.representationId}
          onHide={() => {
            setSelectedRepresentation(null)
          }}
        />
      )}
      <Panel className="nopad">
        <TableWrapper>
          <DataTable
            scrollable
            responsive
            scrollHeight="flex"
            responsiveLayout="scroll"
            resizableColumns
            value={representations}
            dataKey="representationId"
            selectionMode="single"
            selection={selectedRepresentation}
            onSelectionChange={(e) => setSelectedRepresentation(e.value)}
            lazy
            paginator
            filterDisplay="row"
            first={lazyParams.first}
            rows={lazyParams.rows}
            totalRecords={totalCount}
            sortField={lazyParams.sortField}
            sortOrder={lazyParams.sortOrder}
            filters={lazyParams.filters}
            onPage={onPage}
            onSort={onSort}
            onFilter={onFilter}
            loading={loading}
          >
            <Column
              field="folder"
              header="Folder"
              sortable
              filter
              filterMatchModeOptions={textMatchModes}
            />
            <Column
              field="subset"
              header="Subset"
              sortable
              filter
              filterMatchModeOptions={textMatchModes}
            />
            <Column
              field="version"
              header="Version"
              style={{ maxWidth: 150 }}
            />
            <Column
              field="representation"
              header="Representation"
              filter
              filterElement={representationFilterTemplate}
              filterMatchModeOptions={selectMatchModes}
            />
            <Column
              field="fileCount"
              header="File count"
              style={{ maxWidth: 100 }}
            />
            <Column
              field="localStatus"
              header="Local status"
              sortable
              filter
              filterElement={statusFilterTemplate}
              filterMatchModeOptions={selectMatchModes}
              body={(val) => formatStatus(val.localStatus)}
              style={{ maxWidth: 250 }}
            />
            <Column
              field="remoteStatus"
              header="Remote status"
              sortable
              filter
              filterElement={statusFilterTemplate}
              filterMatchModeOptions={selectMatchModes}
              body={(val) => formatStatus(val.remoteStatus)}
              style={{ maxWidth: 250 }}
            />
          </DataTable>
        </TableWrapper>
      </Panel>
    </Section>
  )
}

export default SiteSyncSummary
