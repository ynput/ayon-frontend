import { useEffect, useState } from 'react'
import axios from 'axios'

import AnatomyEditor from '../../containers/anatomyEditor'
import { Button } from 'primereact/button'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'


const defaultTemplate = {"name" : "_", "title" : "<default (built-in)>"}

const TemplateList = ({selectedTemplate, setSelectedTemplate}) => {
  const [templateList, setTemplateList] = useState([])


  useEffect(() => {
    axios.get('/api/anatomy/templates').then((res) => {
      let primaryTemplate = defaultTemplate

      let templates = []
      for (const tpl in res.data.templates) {
        if (tpl.primary)
          primaryTemplate = {name: tpl.name, title: `<default (${tpl.name})>`}

        templates.push({name: tpl.name, title: tpl.title})

      }

      setTemplateList([primaryTemplate, ...templates])

    })

  }, [])


  console.log(selectedTemplate)

  return(
    <div className="wrapper">
      <DataTable
        value={templateList}
        scrollable
        scrollHeight="flex"
        selectionMode="single"
        responsive="true"
        dataKey="name"
        selection={{name: selectedTemplate}}
        onSelectionChange={(e) => setSelectedTemplate(e.value.name)}
      >
        <Column field="title" header="Name" />
      </DataTable>
    </div>
  )

}


const Anatomy = () => {
  const [schema, setSchema] = useState(null)
  const [formData, setFormData] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState("_")

  useEffect(() => {
    axios.get('/api/anatomy/schema').then((res) => {
      setSchema(res.data)
    })
  }, [])

  useEffect(() => {
    axios.get('/api/anatomy/templates/_').then((res) => {
      console.log(res.data)
      setFormData(res.data)
    })
  }, [])

  return (
    <main>
      <section className="lighter" style={{ flexBasis: '600px', padding: 0 }}>
        <TemplateList selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate} />
      </section>

      <section style={{ flexGrow: 1 }} className="invisible">


        <section className="invisible row">
          <Button
            label="Save current template"
            icon="pi pi-plus"
          />
          <Button
            label="Save as a new template"
            icon="pi pi-plus"
          />
          <Button
            label="Delete the template"
            icon="pi pi-times"
          />
          <Button
            label="Set as default template"
            icon="pi pi-times"
          />
          <div style={{ flexGrow: 1 }} />
          <Button
            label="Create a project"
            icon="pi pi-plus"
          />
        </section>

        <section style={{ flexGrow: 1 }}>
          <div className="wrapper" style={{ overflowY: 'scroll' }}>
            <AnatomyEditor
              schema={schema}
              formData={formData}
              onChange={setFormData}
            />
          </div>
        </section>

      </section>
    </main>
  )
}

export default Anatomy
