import { $Any } from '@types'

type Attrib = {
  type?: 'datetime' | 'integer' | 'float'
}


const getParentValue = (
  nodes: $Any,
  nodeId: string,
  attribName: string,
  { self }: { self: boolean },
) => {
  if (!nodes[nodeId]) {
    return null
  }
  if (
    !self &&
    nodes[nodeId].data.attrib[attribName] != null &&
    nodes[nodeId].data.ownAttrib.includes(attribName)
  ) {
    return nodes[nodeId].data.attrib[attribName]
  }

  if (nodes[nodeId].data.__parentId == 'root') {
    return null
  }

  return getParentValue(nodes, nodes[nodeId].data.__parentId, attribName, { self: false })
}

const getTypes = (nodes: $Any, nodeIds: string[]) => {
  const types: string[] = []

  for (const id of nodeIds) {
    if (!types.includes(nodes[id]?.data?.__entityType)) {
      types.push(nodes[id]?.data?.__entityType)
    }
  }

  return types
}

const getInputProps = (attrib: Attrib) => {
  const inputTypes = {
    datetime: { type: 'date' },
    integer: { type: 'number', step: 1 },
    float: { type: 'number', step: 1 },
  }

  if (!attrib) {
    return {}
  }

  let props = {}
  if (attrib.type) {
    const type = inputTypes[attrib.type] || { type: 'string' }
    props = { ...type }
  }

  return props
}

export { getParentValue, getInputProps, getTypes }
