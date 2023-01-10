import axios from 'axios'
import { useState, useEffect } from 'react'
import { Section, Panel } from '@ynput/ayon-react-components'
import { PathField } from '/src/containers/fieldFormat'
import Thumbnail from '/src/containers/thumbnail'
import AttributeTable from '/src/containers/attributeTable'

const WorkfileDetail = ({ projectName, workfileId, style }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!workfileId) {
      setData(null)
      return
    }

    setLoading(true)
    axios
      .get(`/api/projects/${projectName}/workfiles/${workfileId}`)
      .then((res) => {
        setData(res.data)
      })
      .catch((err) => {
        console.log(err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [projectName, workfileId])

  return (
    <Section style={style}>
      <Panel>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            <Thumbnail project={projectName} entityType="workfile" entityId={workfileId} />
            <AttributeTable
              entityType="workfile"
              data={data?.attrib || {}}
              additionalData={[{ title: 'Path', value: <PathField value={data?.path} /> }]}
            />
          </>
        )}
      </Panel>
    </Section>
  )
}

export default WorkfileDetail
