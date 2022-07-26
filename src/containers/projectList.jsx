import { useState, useEffect, useMemo } from 'react'

import { TableWrapper } from '/src/components'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

import axios from 'axios'

const formatName = (rowData, defaultTitle) => {
  if (rowData.name === '_') return defaultTitle
  return rowData.name
}

const ProjectList = ({ selection, onSelect, showNull, multiselect }) => {
  const [projectList, setProjectList] = useState([])

  useEffect(() => {
    let result = []
    if (showNull) result.push({ name: '_' })
    axios
      .get('/api/projects')
      .then((response) => {
        result = [...result, ...(response.data.projects || [])]
      })
      .catch(() => {
        console.error.error('Unable to load projects')
      })
      .finally(() => {
        setProjectList(result)
      })
  }, [])

  const selectionObj = useMemo(() => {
    if (multiselect) {
      let result = []
      for (const project of projectList) {
        if (selection === null) {
          if (project.name === '_') {
            result.push(project)
          }
          break
        }
        if (selection.includes(project.name)) result.push(project)
      }
      return result
    } else {
      for (const project of projectList) {
        if (project.name === selection) return project
        if (!selection && project.name === '_') return project
      }
    } // single select
  }, [selection, projectList])

  const onSelectionChange = (e) => {
    if (!onSelect) return
    if (multiselect) {
      let result = []
      for (const node of e.value) {
        if (node.name === '_') {
          result = null
          break
        }
        result.push(node.name)
      }
      onSelect(result)
    } // multiselect
    else {
      if (e.value.name === '_') onSelect(null)
      else onSelect(e.value.name)
    } // single select
  } // onSelectionChange

  return (
    <TableWrapper>
      <DataTable
        value={projectList}
        scrollable="true"
        scrollHeight="flex"
        selectionMode={multiselect ? 'multiple' : 'single'}
        responsive="true"
        dataKey="name"
        selection={selectionObj}
        onSelectionChange={onSelectionChange}
      >
        <Column
          field="name"
          header="Project name"
          body={(rowData) => formatName(rowData, showNull)}
        />
        <Column field="code" header="Code" style={{ maxWidth: 80 }} />
      </DataTable>
    </TableWrapper>
  )
}

export default ProjectList
