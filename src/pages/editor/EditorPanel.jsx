import React from 'react'
import PropTypes from 'prop-types'
import {
  Panel,
  Button,
  Section,
  Toolbar,
  FormLayout,
  FormRow,
  InputText,
} from '@ynput/ayon-react-components'

import { useSelector } from 'react-redux'
import DetailHeader from '/src/components/DetailHeader'
import StackedThumbnails from './StackedThumbnails'
import OverflowField from '/src/components/OverflowField'
import NameField from './fields/NameField'
import { useState } from 'react'
import { useEffect } from 'react'
import getFieldInObject from '/src/helpers/getFieldInObject'
import { isEmpty } from 'lodash'
import { TypeEditor } from './editors'
import { format } from 'date-fns'

const inputTypes = {
  datetime: { type: 'date' },
  integer: { type: 'number', step: 1 },
  float: { type: 'number', step: 1 },
}

const getInputProps = (attrib = {}) => {
  let props = {}

  if (attrib.type) {
    const type = inputTypes[attrib.type] || { type: 'string' }
    props = { ...type }
  }

  return props
}

const EditorPanel = ({
  onDelete,
  onChange,
  onRevert,
  editorMode = false,
  onAddFolder,
  onAddTask,
  attribs,
}) => {
  // used to throttle changes to redux changes state and keep input fast
  const selected = useSelector((state) => state.context.focused.editor)
  const editorNodes = useSelector((state) => state.editor.nodes)
  const [localChange, setLocalChange] = useState(false)
  const [nodeIds, setNodeIds] = useState([])
  const [nodes, setNodes] = useState({})
  const [form, setForm] = useState({})
  // used to rebuild fields for when the type changes
  const [type, setType] = useState(null)
  // just used to avoid having an uncontrolled input
  const [multiValue] = useState('')
  const changes = useSelector((state) => state.editor.changes)
  const breadcrumbs = useSelector((state) => state.context.breadcrumbs) || {}
  const tasks = useSelector((state) => state.project.tasks)
  const folders = useSelector((state) => state.project.folders)

  useEffect(() => {
    setNodeIds([...selected])
    // set nodes for selection
    const formNodes = {}

    for (const id of selected) {
      if (id in editorNodes) {
        formNodes[id] = editorNodes[id]
      }
    }

    setNodes(formNodes)
  }, [selected, editorNodes])

  const noSelection = !nodeIds.length
  let singleSelect = null
  if (nodeIds.length === 1) {
    singleSelect = nodes[nodeIds[0]]?.data || {}
  }

  const hasLeaf = nodeIds.some((id) => nodes[id]?.leaf)
  const types = []

  for (const id of nodeIds) {
    if (!types.includes(nodes[id]?.data.__entityType)) types.push(nodes[id]?.data.__entityType)
  }

  //   checking if any other types don't match the first one
  const hasMixedTypes = types.length > 1

  //   header
  const thumbnails = nodeIds.map((id) => ({ id, type: nodes[id]?.data.__entityType }))
  let subTitle = ''
  if (singleSelect) {
    subTitle = `/ ${breadcrumbs.parents?.join(' / ')} ${breadcrumbs.parents.length ? ' / ' : ''} ${
      breadcrumbs.folder
    }`

    if (singleSelect.__entityType === 'task') {
      // add on task at end
      if (breadcrumbs.parents.length) subTitle += ' / '
      subTitle += singleSelect.name
    }
  } else {
    subTitle = nodeIds.map((id) => nodes[id]?.data.name).join(', ')
  }

  const createInitialForm = () => {
    const initialForm = {
      _name: {
        changeKey: '_name',
        label: 'Name',
        field: 'name',
        formRow: getFieldValue('name', '_name'),
        type: 'string',
        disabled: !singleSelect,
        placeholder: !singleSelect && 'Names Can Not Be The Same...',
        attrib: {
          type: 'string',
        },
      },
    }

    const type = nodes[nodeIds[0]]?.data.__entityType

    if (type) {
      setType(type)
      // field = folderType or taskType
      const field = `${type}Type`
      const changeKey = '_' + field
      const formRow = getFieldValue(field, changeKey)

      initialForm[changeKey] = {
        changeKey: changeKey,
        label: 'Type',
        field: field,
        disabled: hasMixedTypes,
        placeholder: hasMixedTypes && 'Mixed Entity Types...',
        formRow: formRow,
      }
    }

    // add attribs
    for (const attrib of attribs) {
      const { name, scope, data } = attrib
      const changeKey = name
      const field = 'attrib.' + name
      const newRow = {
        changeKey: changeKey,
        label: data?.title,
        field: field,
        formRow: getFieldValue(field, changeKey),
        disabled: !types.every((t) => scope.includes(t)),
        attrib: attrib.data,
      }

      initialForm[changeKey] = newRow
    }

    return initialForm
  }

  useEffect(() => {
    // resets every time selection is changed
    // changes saved to global state will show up here
    console.log('creating initial form')

    setForm(createInitialForm())
  }, [nodeIds, type])

  //   Handlers

  const handleRevert = () => {
    // revert global state
    onRevert(nodes)
    // revert local form by updating triggering createInitialForm useEffect
    setNodeIds([...nodeIds])
  }

  // look up the og value using field
  // look up any changes using changeKey
  // compare both values and use changedValue if there is one
  // returns [value, isChanged, isOwn]
  const getFieldValue = (field, changeKey) => {
    let finalValue = '',
      multiple = false,
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

      if (finalValue && finalValue !== nodeValue) {
        // different values, this is a multiple filed
        multiple = true
        break
      }

      // final value
      finalValue = nodeValue
    }

    if (multiple) {
      // values are different
      finalValue = multiValue
    }

    return [finalValue, isChanged, isOwn, multiple]
  }

  // update the local form on changes
  const handleLocalChange = (value, changeKey, field, formState, setFormNew) => {
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

      if (type === 'datetime') {
        newValue = new Date(value)
        newValue = newValue.toISOString()
      }

      let isChanged = true

      if (!oldValue.formRow[3]) {
        for (const id of nodeIds) {
          const ogValue = getFieldInObject(field, nodes[id]?.data)

          // dif value or isMultiple
          isChanged = ogValue.toString() !== newValue

          // stop looping if isChanged is ever true
          if (isChanged) break
        }
      }

      newForm[changeKey] = {
        ...newForm[changeKey],
        formRow: [newValue, isChanged, true, oldValue.formRow[3]],
      }

      setLocalChange(true)

      if (setFormNew) return setFormNew(newForm)
      // update state
      setForm(newForm)
    }
  }

  // save and sync changes with table (global redux)
  // we throttle this to keep things fast
  const handleGlobalChange = (value, changeKey) => {
    let allChanges = []
    for (const id in nodes) {
      const node = nodes[id]
      const currentChanges = changes[id] || {
        __entityType: node.data.__entityType,
        __parentId: node.data.__parentId,
      }
      const rowChanges = {
        id,
        ...currentChanges,
        [changeKey]: value,
      }

      allChanges.push(rowChanges)
    }

    onChange(allChanges)
  }

  const handleFormChanged = () => {
    console.log('handling form change')
    setLocalChange(false)
    // loop through form and get any changes
    for (const key in form) {
      const row = form[key]

      // check isChanged
      if (row.formRow[1]) {
        let oldChanges
        if (changes[nodeIds[0]] && key in changes[nodeIds[0]]) {
          oldChanges = changes[nodeIds[0]][key]
        }
        // only update again if old !== new
        if (oldChanges !== row.formRow[0]) {
          console.log('change')
          handleGlobalChange(row.formRow[0], row.changeKey)
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
                console.log('remove key from changes', newChanges)

                onChange([newChanges])
              }
            }
          }
        }
      }
    }
  }

  // every time local form changes, update global state
  // throttle changes to improve perf
  useEffect(() => {
    // check if the change was local or global
    if (!localChange) return

    // check what local changes have been made and syncs with global state
    // throttle this
    handleFormChanged()
  }, [form, nodes, changes])

  return (
    <Section className="wrap">
      <Panel
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <Toolbar>
          <Button
            label={'Delete'}
            icon="delete"
            onClick={() => onDelete(nodes)}
            disabled={noSelection}
          />
          <Button label={`Revert`} icon="replay" onClick={handleRevert} disabled={noSelection} />
        </Toolbar>
        {editorMode && (
          <Toolbar>
            <Button
              icon="create_new_folder"
              label="Add folder"
              disabled={noSelection || hasLeaf}
              onClick={onAddFolder}
            />
            <Button
              icon="add_task"
              label="Add task"
              disabled={noSelection || hasLeaf}
              onClick={onAddTask}
            />
          </Toolbar>
        )}
      </Panel>
      {!noSelection && (
        <>
          <DetailHeader>
            <StackedThumbnails thumbnails={thumbnails} />
            <div style={{ overflowX: 'clip' }}>
              {singleSelect ? (
                <NameField
                  node={singleSelect}
                  changes={changes}
                  styled
                  tasks={tasks}
                  folders={folders}
                  style={{ display: 'flex', gap: 4 }}
                  iconStyle={{ fontSize: 19, marginRight: 0 }}
                />
              ) : (
                <h2>Multiple Selected ({nodeIds.length})</h2>
              )}
              <OverflowField value={subTitle} style={{ left: -3 }} align="left" />
            </div>
          </DetailHeader>
          <Panel>
            <FormLayout>
              {Object.values(form).map(
                (
                  { formRow, label, leafDisabled, changeKey, disabled, placeholder, field, attrib },
                  i,
                ) => {
                  let [value, isChanged, isOwn, isMultiple] = formRow
                  // input type, step, max, min
                  const extraProps = getInputProps(attrib)
                  const typeOptions = type === 'folder' ? folders : tasks

                  if (attrib?.type === 'datetime' && value) {
                    // convert date to right format
                    value = new Date(value)
                    if (value) {
                      value = format(value, 'yyyy-MM-dd')
                    }
                  }

                  // pick a react input
                  let input

                  if (field.includes('Type')) {
                    input = (
                      <TypeEditor
                        value={value}
                        onChange={(v) => handleLocalChange(v, changeKey, field)}
                        options={typeOptions}
                        isChanged={isChanged}
                      />
                    )
                  } else if (field === 'status') {
                    input = null
                  } else {
                    input = (
                      <InputText
                        value={value || ''}
                        disabled={(hasLeaf && leafDisabled) || disabled}
                        onChange={(e) => handleLocalChange(e.target.value, changeKey, field)}
                        placeholder={isMultiple && !disabled ? `Multiple...` : placeholder || ' '}
                        style={{
                          backgroundColor: isChanged ? 'var(--color-row-hl)' : 'initial',
                          color: !isOwn ? 'var(--color-grey-06)' : 'initial',
                        }}
                        {...extraProps}
                      />
                    )
                  }

                  if (!input) return null
                  return (
                    <FormRow key={i} label={label}>
                      {input}
                    </FormRow>
                  )
                },
              )}
            </FormLayout>
          </Panel>
        </>
      )}
    </Section>
  )
}

EditorPanel.propTypes = {
  nodes: PropTypes.object.isRequired,
}

export default EditorPanel
