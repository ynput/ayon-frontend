import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DateTime } from 'luxon'
import { toast } from 'react-toastify'

import axios from 'axios'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'

import ProjectStats from './stats'
import NewProjectDialog from './newProject'

const ProjectManager = () => {
  const navigate = useNavigate()
  const [projectList, setProjectList] = useState([])
  const [projectListTimestamp, setProjectListTimestamp] = useState(0)
  const [selectedProject, setSelectedProject] = useState(null)
  const [showNewProject, setShowNewProject] = useState(false)

  useEffect(() => {
    axios
      .get('/api/projects')
      .then((response) => {
        setProjectList(response.data.projects || [])
      })
      .catch(() => {
        toast.error('Unable to load projects')
      })
  }, [projectListTimestamp])

  const deleteProject = () => {}

  return (
    <main>
     { showNewProject && (
        <NewProjectDialog onHide={() => {
          setProjectListTimestamp(projectListTimestamp + 1)
          setShowNewProject(false)
          }}
       />
     )}

      <section className="lighter" style={{ flexBasis: '600px', padding: 0 }}>
        <div className="wrapper">
          <DataTable
            value={projectList}
            scrollable
            scrollHeight="flex"
            selectionMode="single"
            responsive="true"
            dataKey="name"
            selection={selectedProject}
            onSelectionChange={(e) => setSelectedProject(e.value)}
          >
            <Column field="name" header="Name" />
            <Column
              field="createdAt"
              header="Created"
              body={(rowdata) =>
                DateTime.fromSeconds(rowdata.createdAt).toRelative()
              }
            />
            <Column
              field="updatedAt"
              header="Updated"
              body={(rowdata) =>
                DateTime.fromSeconds(rowdata.updatedAt).toRelative()
              }
            />
          </DataTable>
        </div>
      </section>

      <section style={{ flexGrow: 1 }} className="invisible">
        <section className="invisible row">
          <h1>{selectedProject ? selectedProject.name : 'SELECT A PROJECT'}</h1>
        </section>

        <section className="invisible row">
          <Button
            label="Open selected project"
            icon="pi pi-folder-open"
            disabled={!selectedProject}
            onClick={() =>
              navigate(`/projects/${selectedProject.name}/browser`)
            }
          />
          <Button
            label="Delete selected project"
            icon="pi pi-trash"
            className="p-button-danger"
            disabled={true || !selectedProject}
            onClick={deleteProject}
          />
          <Button
            label="Create a new project"
            icon="pi pi-plus"
            onClick={() => setShowNewProject(true)}
          />
          <div style={{ flexGrow: 1 }} />
        </section>

        <section style={{ flexGrow: 1 }}>
          {selectedProject && (
            <ProjectStats projectName={selectedProject.name} />
          )}
        </section>
      </section>
    </main>
  )
}

export default ProjectManager
