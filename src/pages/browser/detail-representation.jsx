import { useState, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { TreeTable } from 'primereact/treetable'
import { Column } from 'primereact/column'
import { Spacer } from '../../components'

import SiteSyncDetail from '../sitesync/detail'
import { setBreadcrumbs } from '../../features/context'
import { groupResult } from '../../utils'

const columns = [
  {
    field: 'name',
    header: 'Name',
    width: 90,
    expander: true
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
]

const RepresentationDetail = ({ representations }) => {
  const context = useSelector((state) => ({ ...state.context }))
  const projectName = context.projectName
  const dispatch = useDispatch()
  const [selectedRepresentation, setSelectedRepresentation] = useState(null)
  const [focusedRepresentation, setFocusedRepresentation] = useState(null)

  const data = useMemo(() => {
    return groupResult(representations, 'name')
  }, [representations])


  const onRowClick = (e) => {
    dispatch(
      setBreadcrumbs({
        parents: e.node.data.folderParents,
        folder: e.node.data.folderName,
        subset: e.node.data.subsetName,
        version: e.node.data.versionName,
        representation: e.node.data.name,
      })
    )
    if (e.originalEvent.detail === 2) {
      setFocusedRepresentation(e.node.data.id)
    }
  }

  return (
    <>
      {focusedRepresentation && (
        <SiteSyncDetail
          projectName={projectName}
          localSite={null}
          remoteSite={null}
          representationId={focusedRepresentation}
          onHide={() => setFocusedRepresentation(null)}
        />
      )}

      <section className="invisible row">
        <span className="section-header">Representations</span>
        <Spacer />
      </section>
      <section style={{ flexGrow: 1 }}>
        <div className="wrapper">
          <TreeTable
            scrollable="true"
            scrollHeight="100%"
            value={data}
            emptyMessage="No representation found"
            selectionMode="single"
            selectionKeys={selectedRepresentation}
            onSelectionChange={(e) => setSelectedRepresentation(e.value)}
            onRowClick={onRowClick}
          >
            {columns.map((col) => {
              return (
                <Column {...col} key={col.field} style={{ width: col.width }} />
              )
            })}
          </TreeTable>
        </div>
      </section>
    </>
  )
}

export default RepresentationDetail
