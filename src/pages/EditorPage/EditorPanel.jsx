import { isEmpty, isEqual, union } from 'lodash'
import PropTypes from 'prop-types'
import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import {
  Panel,
  Button,
  Section,
  FormLayout,
  FormRow,
  InputText,
  Dropdown,
  AssigneeSelect,
  InputDate,
  InputSwitch,
  TagsSelect,
} from '@ynput/ayon-react-components'

import StatusSelect from '@components/status/statusSelect'
import EntityDetailsHeader from '@components/Details/EntityDetailsHeader'
import EntityThumbnailUploader from '@components/EntityThumbnailUploader'
import { SubRow, Container } from './EditorPanel.styled'
import getFieldInObject from '@helpers/getFieldInObject'
import useCreateContext from '@hooks/useCreateContext'
import useFocusedEntities from '@hooks/useFocused'
import { useGetEntitiesDetailsPanelQuery } from '@queries/entity/getEntityPanel'
import { useGetProjectsInfoQuery } from '@queries/userDashboard/getUserDashboard'
import { entityDetailsTypesSupported } from '@queries/userDashboard/userDashboardQueries'
import { getEntityDetailsData } from '@queries/userDashboard/userDashboardHelpers'

import TypeEditor from './TypeEditor'

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
  attribs,
  projectName,
  onForceChange,
  allUsers,
}) => {
  // SELECTORS
  const selected = useSelector((state) => state.context.focused.editor)
  const editorNodes = useSelector((state) => state.editor.nodes)
  const newNodes = useSelector((state) => state.editor.new)
  const changes = useSelector((state) => state.editor.changes)
  const tasks = useSelector((state) => state.project.tasks)
  const folders = useSelector((state) => state.project.folders)
  const projectTagsOrder = useSelector((state) => state.project.tagsOrder)
  const projectTagsObject = useSelector((state) => state.project.tags)

  // STATES
  // used to throttle changes to redux changes state and keep input fast
  const [localChange, setLocalChange] = useState(false)
  const [nodeIds, setNodeIds] = useState([])
  const [nodes, setNodes] = useState({})
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState({})
  // used to rebuild fields for when the type changes
  const [type, setType] = useState(null)

  const { entities, entityType } = useFocusedEntities(projectName)


  const { data: projectsInfo = {} } = useGetProjectsInfoQuery({ projects: [projectName] })

  // now we get the full details data for selected entities
  let entitiesToQuery = entities.length
    ? entities.map((entity) => ({ id: entity.id, projectName: entity.projectName }))
    : []
  // : entitiesData.map((entity) => ({ id: entity.id, projectName: entity.projectName }))

  const {
    data: detailsData = [],
    isFetching: isFetchingEntitiesDetails,
    isSuccess,
    isError,
    refetch,
    // originalArgs,
  } = useGetEntitiesDetailsPanelQuery(
    { entityType, entities: entitiesToQuery, projectsInfo },
    {
      skip: !entitiesToQuery.length || !entityDetailsTypesSupported.includes(entityType),
    },
  )

  // merge current entities data with fresh details data
  const entityDetailsData = getEntityDetailsData({
    entities,
    entityType,
    projectsInfo,
    detailsData,
    isSuccess,
    isError,
  })

  // when selection or nodes change, update nodes state
  useEffect(() => {
    setNodeIds([...selected])
    // set nodes for selection
    const formNodes = {}

    for (const id of selected) {
      if (id in editorNodes) {
        setIsNew(false)
        formNodes[id] = editorNodes[id]
      } else if (id in newNodes) {
        formNodes[id] = { leaf: newNodes[id]?.__entityType !== 'folder', data: newNodes[id] }
        setIsNew(true)
      }
    }

    setNodes(formNodes)
  }, [selected, editorNodes, newNodes])

  const noSelection = !nodeIds.length
  let singleSelect = null
  if (nodeIds.length === 1) {
    singleSelect = nodes[nodeIds[0]]?.data || {}
  }

  const hasLeaf = nodeIds.some((id) => nodes[id]?.leaf && nodes[id]?.data?.__entityType === 'task')
  // const hasChildren = nodeIds.some(
  //   (id) => nodes[id]?.data?.hasChildren || nodes[id]?.data?.hasTasks,
  // )
  const types = []

  for (const id of nodeIds) {
    if (!types.includes(nodes[id]?.data?.__entityType)) types.push(nodes[id]?.data?.__entityType)
  }

  //   checking if any other types don't match the first one
  const hasMixedTypes = types.length > 1

  const createInitialForm = () => {
    const statusValues = getFieldValue('status', '_status')
    const nameValues = getFieldValue('name', '_name')
    const labelValues = getFieldValue('label', '_label')
    const tagValues = getFieldValue('tags', '_tags')

    const assigneesValues = getFieldValue('assignees', '_assignees', [])

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
      const { multipleValues, isChanged, isOwn, value } = getFieldValue(field, changeKey)

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
      const { multipleValues, isChanged, isOwn, value } = getFieldValue(field, changeKey)
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

  useEffect(() => {
    // resets every time selection is changed
    // changes saved to global state will show up here
    // console.log('creating initial form')

    // console.log(editorNodes['9a3a9040c41511edb8920b11c777c69f'])

    setForm(createInitialForm())
  }, [nodeIds, type, editorNodes])

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
  const getFieldValue = (field, changeKey, type = '') => {
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

  // save and sync changes with table (global redux)
  // we throttle this to keep things fast
  const handleGlobalChange = (value, changeKey) => {
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

  const handleFormChanged = () => {
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
          handleGlobalChange(row.value, row.changeKey)
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

  const handleForceSave = (e) => {
    // we save input straight away with meta + enter key
    if ((e.metaKey || e.ctrl) && e.key === 'Enter') {
      const value = e.target.value
      const changeKey = e.target.id
      onForceChange(changeKey, value, nodeIds, type)
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

  const [fileUploadInProgress, setFileUploadInProgress] = useState(false)
  const ctxMenuItems = () => [
    {
      label: 'Upload New Thumbnail',
      icon: 'upload',
      command: () => setFileUploadInProgress(true)
    },
  ]

  // create the ref and model
  const [ctxMenuShow] = useCreateContext()

  const onContextMenu = (event) => {
    ctxMenuShow(event, ctxMenuItems())
  }

  return (
    <Section wrap id="editor-entity-details-container">
      {!noSelection && (
        <>
        <Container>
          <EntityThumbnailUploader
            isCompact
            entities={isFetchingEntitiesDetails ? entitiesToQuery : entityDetailsData}
            projectName={projectName}
            entityType={entityType}
            onUploaded={operations => {
              const firstOperation = operations[0]
              const {id, updatedAt} = {id: firstOperation.id, updatedAt: firstOperation?.data?.updatedAt}
              setNodes((prev) => {
                let updatedEntity = {...prev[id], data: {...prev[id]?.data, updatedAt: updatedAt}};
                return { ...prev, [id]: updatedEntity }
              })

              refetch()
            }}
            fileUpload={fileUploadInProgress}
            resetFileUploadState={() => setFileUploadInProgress(false)}
          >
            <EntityDetailsHeader
              values={nodeIds.map((id) => nodes[id]?.data)}
              entityType={entityType}
              onContextMenu={onContextMenu}
              tools={
                <>
                  <Button
                    icon="replay"
                    onClick={handleRevert}
                    disabled={noSelection}
                    data-tooltip="Clear changes"
                  />
                  <Button
                    icon="delete"
                    onClick={() => onDelete(nodes)}
                    disabled={noSelection}
                    data-tooltip="Delete"
                  />
                  <Link to={`/projects/${projectName}/browser`}>
                    <Button
                      icon="visibility"
                      disabled={noSelection}
                      data-tooltip="View in Browser"
                    />
                  </Link>
                </>
              }
            />
          </EntityThumbnailUploader>
          </Container>

          <Panel style={{ overflowY: 'auto', height: '100%' }}>
            <FormLayout>
              {Object.values(form).map((row, i) => {
                let {
                  label,
                  leafDisabled,
                  changeKey,
                  disabled,
                  placeholder,
                  field,
                  attrib,
                  value,
                  isChanged,
                  isOwn,
                  multipleValues,
                } = row || {}

                // input type, step, max, min
                const extraProps = getInputProps(attrib)
                const typeOptions = type === 'folder' ? folders : tasks

                const isDate = attrib?.type === 'datetime'
                if (isDate && value) {
                  // convert date to right format
                  value = new Date(value)
                }

                const changedStyles = {
                  backgroundColor: isChanged ? 'var(--color-changed)' : 'initial',
                  color: isChanged ? 'var(--color-on-changed)' : 'initial',
                }

                const borderDynamicStyles = {
                  border: isChanged
                    ? '3px solid var(--md-sys-color-primary)'
                    : '1px solid var(--md-sys-color-outline-variant)',
                }

                let disabledStyles = {}
                if (disabled) {
                  disabledStyles = {
                    opacity: 0.7,
                    fontStyle: 'italic',
                  }
                }

                // pick a react input
                let input

                if (field === 'name' && !isNew) {
                  input = <InputText value={value} disabled readOnly />
                } else if (field.includes('Type')) {
                  input = (
                    <TypeEditor
                      value={multipleValues ? multipleValues : [value]}
                      onChange={(v) => handleLocalChange(v, changeKey, field)}
                      options={typeOptions}
                      style={{
                        width: '100%',
                        minWidth: 'unset',
                      }}
                      isChanged={isChanged}
                      disabled={disabled}
                      placeholder={placeholder}
                    />
                  )
                } else if (field === 'status') {
                  input = (
                    <StatusSelect
                      value={multipleValues || value}
                      multipleSelected={nodeIds.length}
                      onChange={(v) => handleLocalChange(v, changeKey, field)}
                      maxWidth={'100%'}
                      style={borderDynamicStyles}
                      isChanged={isChanged}
                      height={30}
                      placeholder={placeholder}
                      disableMessage
                      widthExpand
                    />
                  )
                } else if (field === 'assignees') {
                  input = (
                    <AssigneeSelect
                      value={multipleValues ? union(...multipleValues) : value || []}
                      options={allUsers}
                      multipleValues={!!multipleValues}
                      placeholder={placeholder}
                      disabled={disabled}
                      emptyMessage={'None assigned'}
                      emptyIcon={false}
                      onChange={(v) => handleLocalChange(v, changeKey, field)}
                      buttonStyle={{
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        overflow: 'hidden',
                      }}
                      isChanged={isChanged}
                      widthExpand
                    />
                  )
                } else if (field === 'tags') {
                  input = (
                    <TagsSelect
                      value={multipleValues ? union(...multipleValues) : value || []}
                      tags={projectTagsObject}
                      tagsOrder={projectTagsOrder}
                      isMultiple={!!multipleValues}
                      onChange={(v) => handleLocalChange(v, changeKey, field)}
                      align="right"
                      width={200}
                      buttonStyle={{ border: '1px solid var(--md-sys-color-outline-variant)' }}
                      isChanged={isChanged}
                      editor
                    />
                  )
                } else if (attrib?.enum) {
                  // dropdown
                  const isMultiSelect = ['list_of_strings'].includes(attrib?.type)
                  let enumValue = isMultiSelect ? value : [value]
                  if (multipleValues) {
                    enumValue = isMultiSelect ? union(...multipleValues) : multipleValues
                  }

                  // never show value when inherited, just show placeholder
                  if (!isOwn) enumValue = null

                  input = (
                    <Dropdown
                      style={{ flexGrow: 1 }}
                      value={enumValue}
                      isChanged={isChanged}
                      options={attrib?.enum}
                      onChange={(v) =>
                        handleLocalChange(isMultiSelect ? v : v[0], changeKey, field)
                      }
                      multiSelect={isMultiSelect}
                      widthExpand
                      emptyMessage={`Select option${isMultiSelect ? 's' : ''}...`}
                      multipleValues={!!multipleValues}
                      onClear={
                        field !== 'attrib.tools'
                          ? (value) => handleLocalChange(value, changeKey, field)
                          : undefined
                      }
                      onClearNull={(value) => handleLocalChange(value, changeKey, field)}
                      nullPlaceholder="(inherited)"
                      search={attrib?.enum?.length > 10}
                    />
                  )
                } else if (isDate) {
                  input = (
                    <InputDate
                      selected={value || undefined}
                      disabled={(hasLeaf && leafDisabled) || disabled}
                      onChange={(date) => handleLocalChange(date, changeKey, field)}
                      style={{
                        ...changedStyles,
                        color: isChanged
                          ? 'var(--color-on-changed)'
                          : !isOwn
                          ? 'var(--md-ref-palette-neutral-variant60)'
                          : 'var(--md-sys-color-on-surface-variant)',
                        ...disabledStyles,
                        width: '100%',
                      }}
                    />
                  )
                } else if (attrib?.type === 'boolean') {
                  input = (
                    <InputSwitch
                      checked={value || false}
                      disabled={disabled}
                      onChange={(e) => handleLocalChange(e.target.checked, changeKey, field)}
                      style={{
                        ...changedStyles,
                        color: isChanged
                          ? 'var(--color-on-changed)'
                          : !isOwn
                          ? 'var(--md-ref-palette-neutral-variant60)'
                          : 'var(--md-sys-color-on-surface-variant)',
                        ...disabledStyles,
                        width: '100%',
                      }}
                    />
                  )
                } else {
                  // input type (text, number, password, etc.) stored in extraProps
                  input = (
                    <InputText
                      value={value || ''}
                      disabled={(hasLeaf && leafDisabled) || disabled}
                      onChange={(e) => handleLocalChange(e.target.value, changeKey, field)}
                      placeholder={placeholder}
                      style={{
                        ...changedStyles,
                        color: isChanged
                          ? 'var(--color-on-changed)'
                          : !isOwn
                          ? 'var(--md-ref-palette-neutral-variant60'
                          : 'var(--md-sys-color-on-surface-variant)',
                        ...disabledStyles,
                        width: '100%',
                        fontStyle: isOwn ? 'normal' : 'italic',
                      }}
                      {...extraProps}
                      onFocus={(e) => e.target?.select()}
                      onKeyDown={handleForceSave}
                      id={changeKey}
                    />
                  )
                }

                if (!input) return null
                return (
                  <FormRow
                    key={i}
                    label={label}
                    className={`editor-form ${field} ${disabled ? 'disabled' : ''}${
                      isOwn ? '' : 'inherited'
                    } ${attrib?.type} ${multipleValues ? 'multipleValues' : ''} ${
                      isChanged ? 'isChanged' : ''
                    }`}
                    fieldStyle={{
                      overflow: !isDate ? 'hidden' : 'visible',
                    }}
                  >
                    <SubRow className={isChanged ? 'isChanged' : ''}>
                      {input}
                      {attrib && !['name', 'label'].includes(field) && isOwn && (
                        <Button
                          onClick={() => handleLocalChange(null, changeKey, field)}
                          icon={'backspace'}
                          tooltip="Clear field"
                          className="null"
                          tabIndex={-1}
                        />
                      )}
                    </SubRow>
                  </FormRow>
                )
              })}
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
