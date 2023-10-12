import React, { useMemo } from 'react'
import AttributeTable from '/src/containers/attributeTable'
import formatAttributesData from './formatAttributesData'

const TaskAttributes = ({ tasks = [], isLoading }) => {
  // we need to get the attributes of the selected tasks

  const attribsData = useMemo(
    () => (!isLoading ? formatAttributesData(tasks) : {}),
    [tasks, isLoading],
  )

  return <AttributeTable entityType={'task'} data={attribsData} isLoading={isLoading} />
}

export default TaskAttributes
