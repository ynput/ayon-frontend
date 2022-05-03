import { useState } from 'react'
import { useSelector } from 'react-redux'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button, Spacer } from '../../components'

import SiteSyncDetail from '../sitesync/detail'

const columns = [
  {
    field: 'name',
    header: 'Name',
    width: 70,
  },
  {
    field: 'folderName',
    header: 'Folder',
    width: 130,
  },
  {
    field: 'subsetName',
    header: 'Subset',
    width: 130,
  },
  {
    field: 'family',
    header: 'Family',
    width: 110,
  },
  {
    field: 'fileCount',
    header: 'Files',
    width: 70,
  },
]

const RepresentationDetail = ({ representations }) => {
  const context = useSelector((state) => ({ ...state.context }))
  const projectName = context.projectName
  const [selectedRepresentation, setSelectedRepresentation] = useState(null)
  const [focusedRepresentation, setFocusedRepresentation] = useState(null)

  return (
    <>
      {focusedRepresentation && (
        <SiteSyncDetail
          projectName={projectName}
          localSite={null}
          remoteSite={null}
          representationId={selectedRepresentation.id}
          onHide={() => {
            setFocusedRepresentation(null)
          }}
        />
      )}

      <section className="invisible row">
        <span className="section-header">Representations</span>
        <Spacer />
        <Button icon="pi pi-bolt" disabled={true} tooltip="Mockup button" />
      </section>
      <section style={{ flexGrow: 1 }}>
        <div className="wrapper">
          <DataTable
            scrollable
            responsive
            resizableColumns
            columnResizeMode="expand"
            scrollDirection="both"
            scrollHeight="flex"
            responsiveLayout="scroll"
            value={representations}
            emptyMessage="No representation found"
            selectionMode="single"
            selection={selectedRepresentation}
            onSelectionChange={(e) => setSelectedRepresentation(e.value)}
            onRowDoubleClick={(e) => setFocusedRepresentation(e.data.id)}
          >
            {columns.map((col) => {
              return (
                <Column {...col} key={col.field} style={{ width: col.width }} />
              )
            })}
          </DataTable>
        </div>
      </section>
    </>
  )
}

export default RepresentationDetail
