import { useSelector } from 'react-redux'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button, Spacer } from '../../components'



const Representations = ({ representations }) => {
  const context = useSelector((state) => ({ ...state.contextReducer }))
  const projectName = context.projectName

  return (
    <>
      <section className="invisible row">
        <span className="section-header">Representations</span>
        <Spacer />
        <Button icon="pi pi-bolt" disabled={true} tooltip="Mockup button" />
      </section>
      <section style={{ flexGrow: 1 }}>
        <div className="wrapper">
          <DataTable
            value={representations}
            scrollable
            responsive
            resizableColumns
            columnResizeMode="expand"
            scrollDirection="both"
            scrollHeight="flex"
            responsiveLayout="scroll"
            emptyMessage="No representation found"
            selectionMode="multiple"
          >
            <Column field="name" header="Name" style={{ width: 60 }} />
            <Column field="folderName" header="Folder" style={{ width: 120 }} />
            <Column field="subsetName" header="Subset" style={{ width: 120 }} />
            <Column field="family" header="Family" style={{ width: 120 }} />
            <Column field="fileCount" header="Files" style={{ width: 70 }} />
            <Column field="localStatus" header="Local" style={{ width: 70 }} />
            <Column
              field="remoteStatus"
              header="Remote"
              style={{ width: 70 }}
            />
          </DataTable>
        </div>
      </section>
    </>
  )
}

export default Representations
