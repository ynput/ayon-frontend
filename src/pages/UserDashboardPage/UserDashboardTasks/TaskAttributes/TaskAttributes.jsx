import React, { useMemo } from 'react'
import AttributeTable from '/src/containers/attributeTable'
import formatAttributesData from './formatAttributesData'
import { Section } from '@ynput/ayon-react-components'

const TaskAttributes = ({ tasks = [], isLoading }) => {
  // we need to get the attributes of the selected tasks

  const attribsData = useMemo(
    () => (!isLoading ? formatAttributesData(tasks) : {}),
    [tasks, isLoading],
  )

  return (
    <Section style={{ padding: '0px 8px' }}>
      <AttributeTable entityType={'task'} data={attribsData} isLoading={isLoading} />
    </Section>
  )
}

export default TaskAttributes
