import { useState, useMemo } from 'react'
import { useFetch } from 'use-http'

import { Dialog } from 'primereact/dialog'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

import { formatStatus } from './common'


const SiteSyncDetailTable = ({data}) => {
  return (
    <DataTable 
      value={data}
    >
          <Column field="baseName" header="Name"/>
          <Column field="size" header="Size"/>
          <Column field="localStatus" header="Local" body={(val) => formatStatus(val.localStatus)} />
          <Column field="remoteStatus" header="Remote" body={(val) => formatStatus(val.remoteStatus)} />
    </DataTable>
  )
}


const SiteSyncDetail = ({
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

export default SiteSyncDetail
