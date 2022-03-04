import { useFetch } from 'use-http'
import { useMemo, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

import { DateTime } from 'luxon'
import { Button } from 'primereact/button'
import { Fieldset } from 'primereact/fieldset'

const ProjectStats = ({ projectName }) => {
  const url = `/api/projects/${projectName}/stats`
  const { data, loading } = useFetch(url, [url])

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

const ProjectsPage = () => {
  const projectListRequest = useFetch('/api/projects', [])
  const [selectedProject, setSelectedProject] = useState(null)
  const history = useHistory()

  const projectList = useMemo(() => {
    if (!projectListRequest.data) return []
    return projectListRequest.data.projects
  }, [projectListRequest.data])

  // const refreshProjectList = () => {
  //     projectListRequest.get()
  // }

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
            responsive={true}
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
            onClick={() => history.push(`/browser/${selectedProject.name}`)}
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
            disabled={true}
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

export default ProjectsPage
