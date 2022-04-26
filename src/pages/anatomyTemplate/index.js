import { useEffect, useState } from 'react'
import axios from 'axios'

import AnatomyEditor from '../../containers/anatomyEditor'


const AnatomyTemplateEditor = () => {

  const [schema, setSchema] = useState(null)
  const [formData, setFormData] = useState(null)

  useEffect(() => {
    axios.get('/api/anatomy/schema')
      .then(res => {
        setSchema(res.data)
      })
  }, [])
  
  useEffect(() => {
    axios.get('/api/anatomy/templates/_')
      .then(res => {

        console.log(res.data)
        setFormData(res.data)
      })
  }, [])



  return (
    <main>
      <section className="lighter" style={{ flexBasis: '600px', padding: 0 }}>
        anatomy templates list

      </section>

      <section style={{ flexGrow: 1 }} className="invisible">
        <div className="wrapper" style={{ overflowY: "scroll"}}>
          <AnatomyEditor schema={schema} formData={formData} onChange={setFormData} />
        </div>
      </section>
    </main>
  )
}

export default AnatomyTemplateEditor
