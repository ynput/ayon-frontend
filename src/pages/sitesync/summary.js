import { useFetch } from 'use-http'
import { useState, useEffect } from 'react'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { MultiSelect } from 'primereact/multiselect'
import { FilterMatchMode } from 'primereact/api'

import { formatStatus, SYNC_STATES } from './common'
import SiteSyncDetail from './detail'

const SiteSyncSummary = ({
  projectName,
  localSite,
  remoteSite,
  names,
  totalCount,
}) => {
  const recordsPerPage = 25

  const baseUrl = `/api/projects/${projectName}/sitesync/state`
  const { request, response } = useFetch(baseUrl)

  const [loading, setLoading] = useState(false)
  const [representations, setRepresentations] = useState([])
  const [selectedRepresentation, setSelectedRepresentation] = useState(null)

  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: recordsPerPage,
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
  })

  const textMatchModes = [
    { label: 'Contains', matchMode: FilterMatchMode.CONTAINS },
  ]
  const selectMatchModes = [{ label: 'In', matchMode: FilterMatchMode.IN }]

  const loadData = async () => {
    setLoading(true)
    console.log(lazyParams)
    let url = `?localSite=${localSite}&remoteSite=${remoteSite}`
    url += `&pageLength=${recordsPerPage}&page=${lazyParams.page + 1}`
    url += `&sortBy=${lazyParams.sortField}`
    url += `&sortDesc=${lazyParams.sortOrder === 1 ? 'true' : 'false'}`
    if (lazyParams.filters.folder.value)
      url += `&folderFilter=${lazyParams.filters.folder.value}`
    if (lazyParams.filters.subset.value)
      url += `&subsetFilter=${lazyParams.filters.subset.value}`
    if (lazyParams.filters.representation.value) {
      for (const val of lazyParams.filters.representation.value)
        url += `&nameFilter=${val}`
    }
    if (lazyParams.filters.localStatus.value) {
      for (const val of lazyParams.filters.localStatus.value)
        url += `&localStatusFilter=${val}`
    }
    if (lazyParams.filters.remoteStatus.value) {
      for (const val of lazyParams.filters.remoteStatus.value)
        url += `&remoteStatusFilter=${val}`
    }

    const newData = await request.get(url)
    if (response.ok) {
      console.log(newData.representations[0])
      setRepresentations(newData.representations)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
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
    <section style={{ flexGrow: 1 }}>
      {selectedRepresentation && <SiteSyncDetail 
          projectName={projectName}
          localSite={localSite}
          remoteSite={remoteSite}
          representationId={selectedRepresentation.representationId}
          onHide={()=>{setSelectedRepresentation(null)}}
        />
      }
      <div className="wrapper">
        <DataTable
          value={representations}
          scrollable
          scrollHeight="flex"
          selectionMode="single"
          responsive={true}
          dataKey="representationId"
          selection={selectedRepresentation}
          onSelectionChange={(e) => setSelectedRepresentation(e.value)}
          lazy
          paginator
          filterDisplay="row"
          first={lazyParams.first}
          rows={recordsPerPage}
          totalRecords={totalCount}
          onPage={onPage}
          onSort={onSort}
          sortField={lazyParams.sortField}
          sortOrder={lazyParams.sortOrder}
          onFilter={onFilter}
          filters={lazyParams.filters}
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
          <Column field="version" header="Version" />
          <Column
            field="representation"
            header="Representation"
            filter
            filterElement={representationFilterTemplate}
            filterMatchModeOptions={selectMatchModes}
          />
          <Column field="fileCount" header="File count" />
          <Column
            field="localStatus"
            header="Local status"
            sortable
            filter
            filterElement={statusFilterTemplate}
            filterMatchModeOptions={selectMatchModes}
            body={(val) => formatStatus(val, "local")}
          />
          <Column
            field="remoteStatus"
            header="Remote status"
            sortable
            filter
            filterElement={statusFilterTemplate}
            filterMatchModeOptions={selectMatchModes}
            body={(val) => formatStatus(val, "remote")}
          />
        </DataTable>
      </div>
    </section>
  )
}

export default SiteSyncSummary
