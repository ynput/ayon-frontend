import React, { useMemo } from 'react'
import AttributeTable from '@containers/attributeTable'
import formatAttributesData from './formatAttributesData'
import { Section } from '@ynput/ayon-react-components'

const TaskAttributes = ({ entities = [], isLoading, entityType }) => {
  // we need to get the attributes of the selected entities

  const attribsData = useMemo(
    () => (!isLoading ? formatAttributesData(entities) : {}),
    [entities, isLoading],
  )

  return (
    <Section style={{ padding: 8, overflow: 'hidden' }}>
      <AttributeTable
        style={{ overflow: 'auto', marginTop: 45 }}
        entityType={entityType}
        data={attribsData}
        isLoading={isLoading}
      />
    </Section>
  )
}

export default TaskAttributes
