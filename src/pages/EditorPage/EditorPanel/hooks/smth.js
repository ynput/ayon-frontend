import getFieldInObject from '@helpers/getFieldInObject'
import { isEmpty, isEqual } from 'lodash'

const getTypes = (nodes, nodeIds) => {
  const types = []

  for (const id of nodeIds) {
    if (!types.includes(nodes[id]?.data?.__entityType)) {
      types.push(nodes[id]?.data?.__entityType)
    }
  }

  return types
}

const getInputProps = (attrib = {}) => {
  const inputTypes = {
    datetime: { type: 'date' },
    integer: { type: 'number', step: 1 },
    float: { type: 'number', step: 1 },
  }

  let props = {}

  if (attrib.type) {
    const type = inputTypes[attrib.type] || { type: 'string' }
    props = { ...type }
  }

  return props
}

// look up the og value using field
// look up any changes using changeKey
// compare both values and use changedValue if there is one
// returns [value, isChanged, isOwn]
const getFieldValue = (field, changeKey, { type = '', nodeIds, nodes, changes }) => {
  let finalValue = '',
    multipleValues = false,
    isChanged = false,
    isOwn = false
  for (const id of nodeIds) {
    let nodeValue

    // split by period
    const keys = field.split('.')
    const data = nodes[id]?.data

    let value = data
    let parent = ''
    for (const key of keys) {
      if (value) {
        // get value and set for next loop
        value = value[key]

        // check if value is inherited or isOwn
        if (parent !== 'attrib') {
          isOwn = true
        } else if (data?.ownAttrib?.includes(key)) isOwn = true
        else isOwn = false
      }

      parent = key
    }

    nodeValue = value

    // check if value exists on changes ID
    if (changes[id] && changeKey in changes[id]) {
      isChanged = nodeValue !== changes[id][changeKey]

      // set new nodeValue to changes
      nodeValue = changes[id][changeKey]

      isOwn = true
    }

    if ((finalValue && finalValue !== nodeValue) || multipleValues) {
      // if value is undefined, skip
      if (nodeValue === undefined) continue
      // if type arrays check dif
      if (Array.isArray(finalValue)) {
        // if not different skip
        if (isEqual(finalValue, nodeValue)) {
          finalValue = nodeValue
          continue
        }
      }
      // different values, this is a multipleValues filed
      // assign array of those values
      if (!multipleValues) {
        // first time there has been a dif value
        multipleValues = [finalValue, nodeValue]
      } else if (!multipleValues?.includes(nodeValue)) {
        // add any more new diff values
        multipleValues?.push(nodeValue)
      }
    } else {
      // final value
      finalValue = nodeValue
    }
  }

  if (multipleValues) {
    // values are different
    finalValue = type
  }

  return { value: finalValue, isChanged, isOwn, multipleValues }
}

const createInitialForm = (types, { nodeIds, nodes, attribs, changes, setType }) => {
  const singleSelect = nodeIds.length === 1 ? nodes[nodeIds[0]]?.data || {} : null

  //   checking if any other types don't match the first one
  const hasMixedTypes = types.length > 1

  const statusValues = getFieldValue('status', '_status', { nodeIds, nodes, changes })
  const nameValues = getFieldValue('name', '_name', { nodeIds, nodes, changes })
  const labelValues = getFieldValue('label', '_label', { nodeIds, nodes, changes })
  const tagValues = getFieldValue('tags', '_tags', { nodeIds, nodes, changes })

  const assigneesValues = getFieldValue('assignees', '_assignees', {
    type: [],
    nodeIds,
    nodes,
    changes,
  })

  const disableMessage = 'Names Can Not Be The Same...'
  const initialForm = {
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
      placeholder: `Folders Can Not Have Assignees...`,
      ...assigneesValues,
    },
    _tags: {
      changeKey: '_tags',
      label: 'Tags',
      field: 'tags',
      ...tagValues,
    },
  }

  const type = nodes[nodeIds[0]]?.data?.__entityType

  if (type) {
    setType(type)
    // field = folderType or taskType
    const field = `${type}Type`
    const changeKey = '_' + field
    const { multipleValues, isChanged, isOwn, value } = getFieldValue(field, changeKey, {
      nodeIds,
      nodes,
      changes,
    })

    let placeholder = ''
    if (hasMixedTypes) {
      placeholder = 'Mixed Entity Types...'
    } else if (multipleValues) {
      placeholder = `Mixed (${multipleValues.join(', ')})`
    }

    initialForm[changeKey] = {
      changeKey,
      field,
      placeholder,
      multipleValues,
      isChanged,
      isOwn,
      value,
      label: 'Type',
      disabled: hasMixedTypes,
    }
  }

  // add attribs
  for (const attrib of attribs) {
    const { name, scope, data } = attrib
    const changeKey = name
    const field = 'attrib.' + name
    const { multipleValues, isChanged, isOwn, value } = getFieldValue(field, changeKey, {
      nodeIds,
      nodes,
      changes,
    })
    const disabled = !types.every((t) => scope.includes(t))
    const placeholder = multipleValues && !disabled ? `Mixed (${multipleValues.join(', ')})` : ''

    // create object
    const newRow = {
      changeKey,
      field,
      disabled,
      placeholder,
      multipleValues,
      isChanged,
      isOwn,
      value,
      label: data?.title,
      attrib: attrib.data,
    }

    initialForm[changeKey] = newRow
  }

  return initialForm
}

const handleGlobalChange = (value, changeKey, { nodes, onChange }) => {
  let allChanges = []
  for (const id in nodes) {
    const node = nodes[id]

    const rowChanges = {
      id,
      __entityType: node.data.__entityType,
      __parentId: node.data.__parentId,
      [changeKey]: value === '' ? null : value,
    }

    allChanges.push(rowChanges)
  }

  onChange(allChanges)
}

const handleFormChanged = (
  form,
  changes,
  { nodeIds, nodes, setLocalChange, onChange, onRevert },
) => {
  setLocalChange(false)
  // loop through form and get any changes
  for (const key in form) {
    const row = form[key]

    // check isChanged
    if (row.isChanged) {
      let oldChanges
      if (changes[nodeIds[0]] && key in changes[nodeIds[0]]) {
        oldChanges = changes[nodeIds[0]][key]
      }
      // only update again if old !== new
      if (oldChanges !== row.value) {
        // console.log('change')
        handleGlobalChange(row.value, row.changeKey, { nodes, onChange })
      }
    } else {
      // nothing has changed so now check if there are changes in global state
      for (const id of nodeIds) {
        if (id in changes) {
          // one of the nodes has changes
          // check if this field is in those changes
          if (key in changes[id]) {
            // new change is the same as og so we can remove this field in changes state
            const newChanges = { ...changes[id], id }
            delete newChanges[key]

            const tempChanges = { ...newChanges }
            delete tempChanges.__entityType
            delete tempChanges.__parentId

            if (isEmpty(tempChanges)) {
              // remove changes object completely
              onRevert(nodes[id])
            } else {
              // console.log('remove key from changes', newChanges)

              onChange([newChanges])
            }
          }
        }
      }
    }
  }
}

// update the local form on changes
const handleLocalChange = (
  value,
  changeKey,
  field,
  { form, formState, nodeIds, nodes, setFormNew, setLocalChange, setForm },
) => {
  // console.log('local change', value, changeKey, field, form)
  let newForm = { ...form }
  if (formState) {
    newForm = formState
  }
  // check key is in form
  if (changeKey in form) {
    const oldValue = newForm[changeKey]
    const type = oldValue?.attrib?.type
    let newValue = value

    if (type === 'datetime' && value) {
      newValue = new Date(value)
      newValue = newValue.toISOString()
    }

    let isChanged = true

    if (!oldValue?.multipleValues && !oldValue?.__new) {
      for (const id of nodeIds) {
        const ogValue = getFieldInObject(field, nodes[id]?.data)

        // if value undefined or it's a new node skip
        // (always changed)
        if (!ogValue || nodes[id]?.__new) break

        // dif value or multipleValues
        isChanged = ogValue?.toString() !== newValue

        // stop looping if isChanged is ever true
        if (isChanged) break
      }
    }

    newForm[changeKey] = {
      ...newForm[changeKey],
      value: newValue,
      isChanged,
      isOwn: true,
      multipleValues: oldValue?.multipleValues && !isChanged,
    }

    setLocalChange(true)

    if (setFormNew) return setFormNew(newForm)
    // update state
    setForm(newForm)
  }
}
export { handleGlobalChange, handleLocalChange, handleFormChanged, createInitialForm, getInputProps, getTypes }
