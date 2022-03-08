import { useState, useMemo, useEffect } from 'react'
import { useFetch } from 'use-http'

import { Dialog } from 'primereact/dialog'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

import { formatStatus } from './common'


const SiteSyncDetailTable = ({data}) => {
  return (
    <div className="wrapper" style={{ display: "flex", margin: "20px", marginTop:"50px"}}>
    <DataTable 
      value={data}
      scrollable
      responsive
      responsiveLayout="scroll"
      scrollHeight="flex"
      selectionMode="single"
      style={{ flexGrow: 1}} 
    >
          <Column field="baseName" header="Name"/>
          <Column field="size" header="Size"/>
          <Column field="localStatus" header="Local" body={(val) => formatStatus(val, "local")} style={{ width: 100}}/>
          <Column field="remoteStatus" header="Remote" body={(val) => formatStatus(val, "remote")} style={{ width: 100}}/>
    </DataTable>
    </div>
  )
}

/*
const SiteSyncDetailRest = ({
  projectName,
  representationId,
  localSite,
  remoteSite,
  onHide,
}) => {
  const baseUrl =
    `/api/projects/${projectName}/sitesync/state` +
    `?representationId=${representationId}` +
    `&localSite=${localSite}` +
    `&remoteSite=${remoteSite}`

  const { data, error, loading } = useFetch(baseUrl, [baseUrl])

  //if (!(representationId && data))
  //  return <></>

  const files = useMemo(()=>{
    if (!data)
      return []
    if (!data.representations)
      return []

    console.log("RAW", data.representations[0])

    let result = []
    for (const file of data.representations[0].files){
      result.push({
        hash: file.fileHash,
        size: file.size,
        path: file.path,
        baseName: file.baseName,
        localStatus: file.localStatus.status,
        remoteStatus: file.remoteStatus.status
      })
    }

    return result


  },[data])

  console.log(files)

  return (
    <Dialog 
      visible 
      onHide={onHide}
      style={{ minHeight: '40%', minWidth: '40%' }}
    >
      <SiteSyncDetailTable data={files}/>
    </Dialog>
  )
}
*/


const FILES_QUERY = `
query Files($projectName: String!, $representationId: String!) {
  project(name: $projectName) {
    representations(ids: [$representationId], localSite:"local", remoteSite:"remote") {
      edges {
        node {
          files {
            hash
            size
            baseName
            localStatus {
              status
              size
            }
            remoteStatus {
              status
              size
            }
          }
        }
      }
    }
  }
}
`


const SiteSyncDetail = ({
  projectName,
  representationId,
  localSite,
  remoteSite,
  onHide,
}) => {

  const { data, loading, request } = useFetch('graphql')

  useEffect(() => {
    request.query(FILES_QUERY, {projectName, representationId})
    // eslint-disable-next-line
  }, [projectName, representationId, localSite, remoteSite])

  const files = useMemo(()=>{
    if (!(data && data.data && data.data.project ))
      return []

    let result = []
    for (const edge of data.data.project.representations.edges){
      const node = edge.node
      for (const file of node.files){
        result.push({
          hash: file.fileHash,
          size: file.size,
          baseName: file.baseName,
          localStatus: file.localStatus.status,
          localSize: file.localStatus.size,
          remoteStatus: file.remoteStatus.status,
          remoteSize: file.remoteStatus.size,
        })
      }
    }

    return result
  },[data])


  return (
    <Dialog 
      visible 
      onHide={onHide}
      style={{ minHeight: '40%', minWidth: '40%' }}
    >
      {loading ? <span>loading</span> : <SiteSyncDetailTable data={files}/>}
    </Dialog>
  )
}


export default SiteSyncDetail
