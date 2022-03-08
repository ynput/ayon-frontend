import { useMemo, useEffect } from 'react'
import { useFetch } from 'use-http'

import { Dialog } from 'primereact/dialog'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

import { formatStatus } from './common'

const formatFileSize = (bytes, si = false, dp = 1) => {
  const thresh = si ? 1000 : 1024
  if (Math.abs(bytes) < thresh) {
    return bytes + ' B'
  }
  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
  let u = -1
  const r = 10 ** dp
  do {
    bytes /= thresh
    ++u
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  )
  return bytes.toFixed(dp) + ' ' + units[u]
}

const SiteSyncDetailTable = ({ data, localSite, remoteSite }) => {
  return (
    <div
      className="wrapper"
      style={{ display: 'flex', margin: '20px', marginTop: '50px' }}
    >
      <DataTable
        value={data}
        scrollable
        responsive
        responsiveLayout="scroll"
        scrollHeight="flex"
        selectionMode="single"
        style={{ flexGrow: 1 }}
      >
        <Column field="baseName" header="Name" />
        <Column
          field="size"
          header="Size"
          body={(row) => formatFileSize(row.size)}
          style={{ maxWidth: 200 }}
        />
        {localSite && (
          <Column
            field="localStatus"
            header="Local"
            body={(val) => formatStatus(val.localStatus)}
            style={{ maxWidth: 150 }}
          />
        )}
        {remoteSite && (
          <Column
            field="remoteStatus"
            header="Remote"
            body={(val) => formatStatus(val.remoteStatus)}
            style={{ maxWidth: 150 }}
          />
        )}
      </DataTable>
    </div>
  )
}

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
              totalSize
            }
            remoteStatus {
              status
              size
              totalSize
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
    request.query(FILES_QUERY, { projectName, representationId })
    // eslint-disable-next-line
  }, [projectName, representationId, localSite, remoteSite])

  const files = useMemo(() => {
    if (!(data && data.data && data.data.project)) return []

    let result = []
    for (const edge of data.data.project.representations.edges) {
      const node = edge.node
      for (const file of node.files) {
        result.push({
          hash: file.fileHash,
          size: file.size,
          baseName: file.baseName,
          localStatus: file.localStatus,
          remoteStatus: file.remoteStatus,
        })
      }
    }

    return result
  }, [data])

  return (
    <Dialog visible onHide={onHide} style={{ minHeight: '40%', minWidth: 900 }}>
      {loading ? (
        <span>loading</span>
      ) : (
        <SiteSyncDetailTable
          data={files}
          localSite={localSite}
          remoteSite={remoteSite}
        />
      )}
    </Dialog>
  )
}

export default SiteSyncDetail
