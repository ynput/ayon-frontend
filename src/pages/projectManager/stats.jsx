import { useState, useEffect } from 'react'
import axios from 'axios'
import { Fieldset } from 'primereact/fieldset'
import { toast } from 'react-toastify'

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

export default ProjectStats
