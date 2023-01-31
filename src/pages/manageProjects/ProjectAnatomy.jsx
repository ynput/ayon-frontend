import axios from 'axios'
import { toast } from 'react-toastify'
import { useState, useEffect, useMemo } from 'react'
import { Section, ScrollPanel, Toolbar, Button } from '@ynput/ayon-react-components'
import SettingsEditor from '/src/containers/settingsEditor'

const ProjectAnatomy = ({ projectName }) => {
  const [schema, setSchema] = useState(null)
  const [originalData, setOriginalData] = useState(null)
  const [newData, setNewData] = useState(null)

  useEffect(() => {
    axios.get('/api/anatomy/schema').then((res) => setSchema(res.data))
  }, [])

  // TODO: RTK QUERY
  useEffect(() => {
    axios.get(`/api/projects/${projectName}/anatomy`).then((res) => {
      setNewData(res.data)
      setOriginalData(res.data)
    })
  }, [projectName])

  const saveAnatomy = () => {
    console.log(newData)
    axios
      .post(`/api/projects/${projectName}/anatomy`, newData)
      .then(() => {
        toast.info(`Anatomy saved`)
      })
      .catch((err) => {
        toast.error(err.message)
      })
  }

  const editor = useMemo(() => {
    if (!(schema && originalData)) return 'Loading editor...'

    return <SettingsEditor schema={schema} formData={originalData} onChange={setNewData} />
  }, [schema, originalData])

  return (
    <Section>
      <Toolbar>
        <Button label="Update anatomy" icon="save" onClick={saveAnatomy} />
      </Toolbar>
      <Section>
        <ScrollPanel
          className="transparent nopad"
          style={{ flexGrow: 1 }}
          scrollStyle={{ padding: 0 }}
        >
          {editor}
        </ScrollPanel>
      </Section>
    </Section>
  )
}

export default ProjectAnatomy
