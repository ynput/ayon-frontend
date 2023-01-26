import { Section, Panel } from '@ynput/ayon-react-components'
import { PathField } from '/src/containers/fieldFormat'
import Thumbnail from '/src/containers/thumbnail'
import AttributeTable from '/src/containers/attributeTable'
import { useSelector } from 'react-redux'
import { useGetWorkfileByIdQuery } from '/src/services/getWorkfiles'
import { toast } from 'react-toastify'

const WorkfileDetail = ({ workfileId, style }) => {
  const projectName = useSelector((state) => state.context.projectName)

  const { data, isLoading, isError, error } = useGetWorkfileByIdQuery(
    { projectName, id: workfileId },
    { skip: !workfileId },
  )

  if (isError) {
    // log and toast error
    console.error(error)
    toast.error(error.message)
    toast.error('Error fetching workfile details')

    return <div>Error</div>
  }

  return (
    <Section style={style}>
      <Panel>
        {isLoading ? (
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
