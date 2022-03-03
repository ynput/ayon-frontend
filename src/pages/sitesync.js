import { useFetch } from "use-http"
import { useSelector } from "react-redux"
import { useState, useEffect } from "react"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"

import ProjectWrapper from '../containers/project-wrapper'

const SiteSync = () => {
  const context = useSelector(state => ({...state.contextReducer}))
  const projectName = context.projectName

  const url = `/api/projects/${projectName}/sitesync/state?localSite=local&remoteSite=remote`

  const [selectedRepresentation, setSelectedRepresentation] = useState(null)
  const [data] = useFetch(url, [url])

  useEffect(() => {
    console.log(data)
  },[data])

  return (
      <section style={{ flexGrow: 1}}>
      <div className="wrapper">
      <DataTable 
          value={data.data ? data.data.representations : {}} 
          scrollable 
          scrollHeight="flex"
          selectionMode="single" 
          responsive={true}
          loading={!data.data}
          dataKey="representationId"
          selection={selectedRepresentation}
          onSelectionChange={
              e => setSelectedRepresentation(e.value)
          }
      >
          <Column field="folder" header="Folder" />
          <Column field="subset" header="Subset" />
          <Column field="version" header="Version" />
          <Column field="representation" header="Representation" />
          <Column field="fileCount" header="File count" />
          <Column field="localStatus" header="Local status" />
          <Column field="remoteStatus" header="Remote status" />
      </DataTable>
      </div>
      </section>
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
