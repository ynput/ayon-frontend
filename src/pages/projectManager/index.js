import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DateTime } from 'luxon'
import { toast } from 'react-toastify'

import axios from 'axios'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'
import { Fieldset } from 'primereact/fieldset'

const ProjectStats = ({ projectName }) => {
  const url = `/api/projects/${projectName}/stats`
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({})

  useEffect(() => {
    setLoading(true)
    axios
      .get(url)
      .then((response) => {
        setData(response.data)
      })
      .catch(() => {
        toast.error('Unable to load project statistics')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [url])

  if (loading) return <></>

  if (!(data && data.counts)) return <></>

  return (
    <Fieldset legend="Project statistics">
      <ul>
        {Object.keys(data.counts).map((key) => (
          <li key={key}>
            {key} : {JSON.stringify(data.counts[key])}
          </li>
        ))}
      </ul>
    </Fieldset>
  )
}

const ProjectManager = () => {
  const navigate = useNavigate()
  const [projectList, setProjectList] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)

  useEffect(() => {
    axios
      .get('/api/projects')
      .then((response) => {
        setProjectList(response.data.projects || [])
      })
      .catch(() => {
        toast.error('Unable to load projects')
      })
  }, [])

  const deleteProject = () => {}

  return (
    <main>
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
            onClick={() => navigate(`/projects/${selectedProject.name}/browser`)}
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
            onClick={() => navigate('/anatomy')}
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
