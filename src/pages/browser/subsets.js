import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'

import axios from 'axios'

import { InputText, Spacer, Button, Shade } from '../../components'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

import { setFocusedVersions, setBreadcrumbs } from '../../features/context'

import { DEFAULT_COLUMNS, SUBSET_QUERY, parseSubsetData } from './subset-utils'

const Subsets = ({ projectName, folders, focusedVersions }) => {
  const dispatch = useDispatch()
  const [subsetData, setSubsetData] = useState([])
  const [selection, setSelection] = useState([])
  const [loading, setLoading] = useState(false)
  const columns = DEFAULT_COLUMNS

  useEffect(() => {
    if (folders.length === 0) return

    setLoading(true)
    axios
      .post('/graphql', {
        query: SUBSET_QUERY,
        variables: { folders, projectName },
      })
      .then((response) => {
        if (!(response.data.data && response.data.data.project)) {
          toast.error('Ubable to fetch subsets')
          return
        }
        setSubsetData(parseSubsetData(response.data.data))
      })
      .finally(() => {
        setLoading(false)
      })
    // eslint-disable-next-line
  }, [folders, projectName])

  useEffect(() => {
    setSelection([
      ...subsetData.filter((s) => focusedVersions.includes(s.versionId)),
    ])
  }, [subsetData, focusedVersions])

  return (
    <section className="invisible insplit">
      <section className="invisible row">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            style={{ width: '200px' }}
            placeholder="Filter subsets..."
            disabled={true}
          />
        </span>
        <Button
          icon="pi pi-list"
          tooltip="Mockup button"
          disabled={true}
          tooltipOptions={{ position: 'bottom' }}
        />
        <Button
          icon="pi pi-th-large"
          tooltip="Mockup button"
          disabled={true}
          tooltipOptions={{ position: 'bottom' }}
        />
        <Spacer />
        <Button
          icon="pi pi-lock"
          tooltip="Mockup button"
          disabled={true}
          tooltipOptions={{ position: 'bottom' }}
        />
        <Button
          icon="pi pi-sitemap"
          tooltip="Mockup button"
          disabled={true}
          tooltipOptions={{ position: 'bottom' }}
        />
        <Button
          icon="pi pi-star"
          tooltip="Mockup button"
          disabled={true}
          tooltipOptions={{ position: 'bottom' }}
        />
        <Button
          icon="pi pi-cog"
          tooltip="Mockup button"
          disabled={true}
          tooltipOptions={{ position: 'bottom' }}
        />
      </section>

      <section
        style={{
          flexGrow: 1,
          padding: 0,
        }}
      >
        <div className="wrapper">
          {loading && <Shade />}
          <DataTable
            scrollable
            responsive="true"
            resizableColumns
            columnResizeMode="expand"
            scrollDirection="both"
            scrollHeight="flex"
            responsiveLayout="scroll"
            value={subsetData}
            emptyMessage="No subset found"
            selectionMode="multiple"
            selection={selection}
            onSelectionChange={(e) => {
              let selection = []
              for (let elm of e.value) {
                if (elm.versionId) selection.push(elm.versionId)
              }
              dispatch(setFocusedVersions(selection))
            }}
            onRowClick={(e) => {
              dispatch(
                setBreadcrumbs({
                  parents: e.data.parents,
                  folder: e.data.folder,
                  subset: e.data.name,
                  version: e.data.versionName,
                })
              )
            }}
          >
            {columns.map((col) => {
              return (
                <Column {...col} key={col.field} style={{ width: col.width }} />
              )
            })}
          </DataTable>
        </div>
      </section>
    </section>
  )
}

export default Subsets
