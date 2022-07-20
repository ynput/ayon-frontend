import { useState, useEffect, useMemo } from 'react'

import { TableWrapper } from '/src/components'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

import axios from 'axios'

const formatName = (rowData, defaultTitle) => {
  if (rowData.name === '_') return defaultTitle
  return rowData.name
}

const ProjectList = ({ selectedProject, onSelectProject, showNull }) => {
  const [projectList, setProjectList] = useState([])

  useEffect(() => {
    let result = []
    if (showNull) result.push({name: "_"})
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

  const selection = useMemo(() => {
    for (const project of projectList) {
      if (project.name === selectedProject) return project
      if (!selectedProject && project.name === '_') return project
    }
  }, [selectedProject, projectList])

  const onSelectionChange = (e) => {
    if (!onSelectProject) return
    if (e.value.name === '_') {
      onSelectProject(null)
      return
    }
    onSelectProject(e.value.name)
  }

  return (
    <TableWrapper>
      <DataTable
        value={projectList}
        scrollable="true"
        scrollHeight="flex"
        selectionMode="single"
        responsive="true"
        dataKey="name"
        selection={selection}
        onSelectionChange={onSelectionChange}
      >
        <Column field="name" header="Project name" body={rowData => formatName(rowData, showNull)} />
        <Column field="code" header="Code" style={{ maxWidth: 80 }} />
      </DataTable>
    </TableWrapper>
  )
}

export default ProjectList
