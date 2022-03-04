import { useFetch } from "use-http"
import { useSelector } from "react-redux"
import { useState, useEffect } from "react"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import { MultiSelect } from "primereact/multiselect"
import { FilterMatchMode } from 'primereact/api'

import ProjectWrapper from '../containers/project-wrapper'


const SYNC_STATES = [
  {name: "N/A", value: -1},
  {name: "In progress", value: 0},
  {name: "Queued", value: 1},
  {name: "Failed", value: 2},
  {name: "Paused", value: 3},
  {name: "Synced", value: 4}
]


const SiteSyncTable = ({ projectName, localSite, remoteSite, names, totalCount }) => {

  const recordsPerPage = 25
  
  const baseUrl = `/api/projects/${projectName}/sitesync/state?localSite=${localSite}&remoteSite=${remoteSite}`
  const {request, response} = useFetch(baseUrl)

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
            'folder': { value: '', matchMode: 'contains' },
            'subset': { value: '', matchMode: 'contains' },
            'representation': { value: null, matchMode: FilterMatchMode.IN },
            'localStatus': { value: null, matchMode: FilterMatchMode.IN },
            'remoteStatus': { value: null, matchMode: FilterMatchMode.IN },
        }
    });


  const loadData = async () => {
    //if (representations.length === totalCount)
    //  return
    setLoading(true)
    console.log(lazyParams)

    let url = `&pageLength=${recordsPerPage}&page=${lazyParams.page + 1}`
    url += `&sortBy=${lazyParams.sortField}`
    url += `&sortDesc=${lazyParams.sortOrder === 1 ? 'true' : 'false'}`
    if (lazyParams.filters.folder.value)
      url += `&folderFilter=${lazyParams.filters.folder.value}`
    if (lazyParams.filters.subset.value)
      url += `&subsetFilter=${lazyParams.filters.subset.value}`
    if (lazyParams.filters.representation.value){
      for (const val of lazyParams.filters.representation.value)
        url += `&nameFilter=${val}`
    }
    if (lazyParams.filters.localStatus.value){
      for (const val of lazyParams.filters.localStatus.value)
        url += `&localStatusFilter=${val}`
    }
    if (lazyParams.filters.remoteStatus.value){
      for (const val of lazyParams.filters.remoteStatus.value)
        url += `&remoteStatusFilter=${val}`
    }

    const newData = await request.get(url)
    if (response.ok){
      //setRepresentations([...representations, ...newData.representations])
      setRepresentations(newData.representations)
    }
    setLoading(false)
  }

    useEffect(() => {
        loadData()
    },[lazyParams]) 

    const onPage = (event) => {
        setLazyParams(event);
    }

    const onSort = (event) => {
        event['first'] = 0;
        event['page'] = 0;
        setLazyParams(event);
    }

    const onFilter = (event) => {
        event['first'] = 0;
        event['page'] = 0;
        setLazyParams(event);
    } 

    const representationFilterTemplate = (options) => {
        return <MultiSelect 
          value={options.value} 
          options={names} 
          onChange={(e) => options.filterApplyCallback(e.value)} 
          optionLabel="name" 
          placeholder="Any" 
          className="p-column-filter" 
          maxSelectedLabels={1} 
          />
    }

    const statusFilterTemplate = (options) => {
        return <MultiSelect 
          value={options.value} 
          options={SYNC_STATES} 
          onChange={(e) => options.filterApplyCallback(e.value)} 
          optionLabel="name" 
          placeholder="Any" 
          className="p-column-filter" 
          maxSelectedLabels={1} 
          />
    }

  return (
    <>
      <section style={{ flexGrow: 1}}>
      <div className="wrapper">
      <DataTable 
          value={representations} 
          scrollable 
          scrollHeight="flex"
          selectionMode="single" 
          responsive={true}
          dataKey="representationId"
          selection={selectedRepresentation}
          onSelectionChange={
            e => setSelectedRepresentation(e.value)
          }

          lazy 
          filterDisplay="row" 
          paginator 
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
          <Column field="folder" sortable filter header="Folder" />
          <Column field="subset" sortable filter header="Subset" />
          <Column field="version" header="Version" />
          <Column 
            field="representation" 
            header="Representation" 
            filter 
            filterElement={representationFilterTemplate}  
          />
          <Column field="fileCount" header="File count" />
          <Column 
            field="localStatus" 
            header="Local status" 
            sortable
            filter 
            filterElement={statusFilterTemplate}  
          />
          <Column 
            field="remoteStatus" 
            header="Remote status" 
            sortable
            filter 
            filterElement={statusFilterTemplate}  
          />
      </DataTable>
      </div>
      </section>
    </>
  )

}



const SiteSync = () => {
  const context = useSelector(state => ({...state.contextReducer}))
  const projectName = context.projectName

  const localSite = "local"
  const remoteSite = "remote"

  const url = `/api/projects/${projectName}/sitesync/params`
  const {loading, error, data={}} = useFetch(url, [url])

  if (error)
    return <h1>error</h1>

  if (loading)
    return <h1>loading</h1>

  let repreNames = []
  for (const name of data.names)
    repreNames.push({name: name, value: name})

  console.log(repreNames)
  
  return (
    <SiteSyncTable
      projectName={projectName}
      localSite={localSite}
      remoteSite={remoteSite}
      names={repreNames}
      totalCount={data.count}
    />
  )
}


const SiteSyncPage = () => {
  return (
    <main className="rows">
      <ProjectWrapper>
        <SiteSync /> 
      </ProjectWrapper>
    </main>
  )
}


export default SiteSyncPage
