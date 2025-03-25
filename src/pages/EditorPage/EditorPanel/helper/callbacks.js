import { isEmpty, isEqual } from 'lodash'
import { getInitialForm, getParentValue, getTypes, hasChanged } from './entityHelpers'

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


const createInitialForm = ({ nodeIds, nodes, editorNodes, attribs, changes, setType }) => {
  const types = getTypes(nodes, nodeIds)

  const statusValues = getFieldValue('status', '_status', { nodeIds, nodes, changes })
  const nameValues = getFieldValue('name', '_name', { nodeIds, nodes, changes })
  const labelValues = getFieldValue('label', '_label', { nodeIds, nodes, changes })
  const tagValues = getFieldValue('tags', '_tags', { nodeIds, nodes, changes })
  const assigneesValues = getFieldValue('assignees', '_assignees', {
    type: [],
    nodeIds,
    nodes,
    changes,
    tagValues
  })

  const initialForm = getInitialForm(nodeIds.length === 1 ? nodes[nodeIds[0]]?.data || {} : null, {
    types,
    statusValues,
    nameValues,
    labelValues,
    assigneesValues,
    tagValues
  })

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

    //   checking if any other types don't match the first one
    const hasMixedTypes = types.length > 1

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
      parentValue: getParentValue(editorNodes, nodeIds[0], attrib.name, {self: true}),
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

const handleFormChanged = (form, changes, { nodeIds, nodes, onChange, onRevert }) => {
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
            delete tempChanges.id

            if (isEmpty(tempChanges)) {
              // remove changes object completely
              onRevert(nodes[id])
            } else {
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
  { form, nodeIds, nodes, setLocalChange, setForm, isAttribute = true },
) => {
  if (!(changeKey in form)) {
    return
  }

  let newForm = { ...form }

  const oldValueObj = newForm[changeKey]
  const type = oldValueObj?.attrib?.type
  let newValue = value

  if (type === 'datetime' && value) {
    newValue = new Date(value)
    newValue = newValue.toISOString()
  }

  const isChanged = hasChanged(oldValueObj, field, changeKey, newValue, { nodeIds, nodes, isAttribute })

  newForm[changeKey] = {
    ...newForm[changeKey],
    value: newValue,
    isChanged,
    isOwn: newValue !== null,
    multipleValues: oldValueObj?.multipleValues && !isChanged,
  }

  setLocalChange(true)

  setForm(newForm)
}

const resetMultiSelect = (form, changeKey, field, {setLocalChange, setForm, nodeIds, nodes}) => {
  const oldValueObj = form[changeKey]
  let newForm = { ...form }
  const isChanged = hasChanged(oldValueObj, field, changeKey, null, {nodeIds, nodes})


  newForm[changeKey] = {
    ...newForm[changeKey],
    value: null,
    isChanged : isChanged,
    isOwn: false,
    multipleValues: form[changeKey]?.multipleValues && !isChanged,
  }

  setLocalChange(true)
  setForm(newForm)
}

export {
  handleLocalChange,
  handleFormChanged,
  createInitialForm,
  resetMultiSelect,
}
