import { useState, useEffect } from 'react'

import { TableWrapper } from '/src/components'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

import axios from 'axios'

const ALL_PROJECTS = {
  name: "_"
}

const ProjectList = ({ selectedProject, onSelectProject, showAllProjects }) => {
  const [projectList, setProjectList] = useState([])

  useEffect(() => {
    let result = []
    if (showAllProjects)
      result.push(ALL_PROJECTS)
    axios
      .get('/api/projects')
      .then((response) => {
        result = [...result, ...response.data.projects || []]
      })
      .catch(() => {
        console.error.error('Unable to load projects')
      })
      .finally(() => {
        setProjectList(result)
      })
  }, [])

  const formatName = (rowData) => {
    if (rowData.name === "_")
      return "(all projects)"
    return rowData.name
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
        selection={selectedProject}
        onSelectionChange={(e) => onSelectProject && onSelectProject(e.value.name)}
      >
        <Column field="name" header="Project name" body={formatName}/>
        <Column field="code" header="Code" style={{ maxWidth: 80 }} />
      </DataTable>
    </TableWrapper>
  )
}

export default ProjectList
