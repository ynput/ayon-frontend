import { isEqual } from 'lodash'
import getFieldInObject from '@helpers/getFieldInObject'
import { $Any } from '@types'

type Attrib = {
  type?: 'datetime' | 'integer' | 'float'
}

const getInitialForm = (
  singleSelect: boolean,
  {
    types,
    statusValues,
    nameValues,
    labelValues,
    assigneesValues,
    tagValues,
  }: {
    types: $Any
    statusValues: $Any
    nameValues: $Any
    labelValues: $Any
    assigneesValues: $Any
    tagValues: $Any
  },
) => {
  const disableMessage = 'Names Can Not Be The Same...'

  return {
    _label: {
      changeKey: '_label',
      label: 'Label',
      field: 'label',
      type: 'string',
      disabled: !singleSelect,
      placeholder: !singleSelect ? disableMessage : '',
      attrib: {
        type: 'string',
      },
      ...labelValues,
      value: singleSelect ? labelValues.value : disableMessage,
    },
    _name: {
      changeKey: '_name',
      label: 'Name',
      field: 'name',
      type: 'string',
      disabled: !singleSelect,
      placeholder: !singleSelect ? disableMessage : '',
      attrib: {
        type: 'string',
      },
      ...nameValues,
      value: singleSelect ? nameValues.value : disableMessage,
    },
    _status: {
      changeKey: '_status',
      label: 'Status',
      field: 'status',
      placeholder: `Mixed (${
        statusValues.multipleValues && statusValues.multipleValues.join(', ')
      })`,
      ...statusValues,
    },
    _assignees: {
      changeKey: '_assignees',
      label: 'Assignees',
      field: 'assignees',
      disabled: !types.includes('task'),
      placeholder: `Folders can not have assignees`,
      ...assigneesValues,
    },
    _tags: {
      changeKey: '_tags',
      label: 'Tags',
      field: 'tags',
      ...tagValues,
    },
  }
}

const hasChanged = (
  oldValueObj: $Any,
  field: string,
  changeKey: string,
  newValue: string | null,
  { nodes, nodeIds, isAttribute }: { nodes: $Any; nodeIds: string[]; isAttribute: boolean },
) => {
  // Original condition, doesn't make much sense??
  /*
  if (!oldValueObj?.multipleValues) {
    return true
  }
  */
  if (oldValueObj?.__new) {
    return true
  }

  for (const id of nodeIds) {
    const ogValue = getFieldInObject(field, nodes[id]?.data)

    // if value undefined or it's a new node skip
    // (always changed)
    if (!ogValue || nodes[id]?.__new) {
      return true
    }

    // diff value or multipleValues
    const ownValue = !isAttribute || nodes[id]?.data.ownAttrib.includes(changeKey)

    const isSame =
      (!ownValue && (newValue === undefined || newValue === null || isEqual(newValue, []))) ||
      (ownValue && isEqual(ogValue, newValue))

    // stop looping if isChanged is ever true
    if (!isSame) {
      return true
    }
  }

  return false
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

const getTypedValue = (attrib: Attrib, value?: string) => {
  if (attrib.type == 'float') {
    return parseFloat(value || '0')
  }

  if (attrib.type == 'integer') {
    return parseInt(value || '0')
  }

  return value || ''
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

export { getInitialForm, getParentValue, getInputProps, getTypes, hasChanged, getTypedValue }
