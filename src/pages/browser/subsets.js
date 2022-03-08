import { useState, useEffect } from 'react'
import { useFetch } from 'use-http'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'

import { InputText, Spacer, Button, Shade } from '../../components'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

import { DEFAULT_COLUMNS, SUBSET_QUERY, parseSubsetData } from './subset-utils'

const Subsets = () => {
  const dispatch = useDispatch()
  const context = useSelector((state) => ({ ...state.contextReducer }))
  const folders = context.focusedFolders
  const projectName = context.projectName

  const request = useFetch('/graphql')
  const [subsetData, setSubsetData] = useState([])
  const [selection, setSelection] = useState([])
  //const [columns, setColumns] = useState(DEFAULT_COLUMNS)
  const columns = DEFAULT_COLUMNS

  useEffect(() => {
    // useEffect and useState is used here, because of the async function
    // useMemo returns a promise, which we don't want
    async function fetchSubsets() {
      if (folders.length === 0) return
      const data = await request.query(SUBSET_QUERY, { folders, projectName })
      if (!(data.data && data.data.project)) {
        toast.error('Ubable to fetch subsets')
        return
      }
      setSubsetData(parseSubsetData(data.data))
    }

    fetchSubsets()
    // eslint-disable-next-line
  }, [folders, projectName])

  useEffect(() => {
    setSelection([
      ...subsetData.filter((s) =>
        context.focusedVersions.includes(s.versionId)
      ),
    ])
  }, [subsetData, context.focusedVersions])

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
          {request.loading && <Shade />}
          <DataTable
            scrollable
            responsive
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
              dispatch({
                type: 'SET_FOCUSED_VERSIONS',
                objects: selection,
              })
            }}
            onRowClick={(e) => {
              dispatch({
                type: 'SET_BREADCRUMBS',
                parents: e.data.parents,
                folder: e.data.folder,
                subset: e.data.name,
                version: e.data.versionName,
              })
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
