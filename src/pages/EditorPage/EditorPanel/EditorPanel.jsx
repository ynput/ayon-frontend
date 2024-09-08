import { union } from 'lodash'
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
} from '@ynput/ayon-react-components'

import StatusSelect from '@components/status/statusSelect'
import EntityDetailsHeader from '@components/Details/EntityDetailsHeader'
import EntityThumbnailUploader from '@components/EntityThumbnailUploader/EntityThumbnailUploader'
import { SubRow } from './EditorPanel.styled'
import useFocusedEntities from '@hooks/useFocused'
import { useGetEntitiesDetailsPanelQuery } from '@queries/entity/getEntityPanel'
import { useGetProjectsInfoQuery } from '@queries/userDashboard/getUserDashboard'
import { entityDetailsTypesSupported } from '@queries/userDashboard/userDashboardQueries'
import { getEntityDetailsData } from '@queries/userDashboard/userDashboardHelpers'

import {
  createInitialForm,
  getInputProps,
  getTypes,
  handleFormChanged,
  handleLocalChange,
} from './hooks/smth'
import TypeEditor from '../TypeEditor'
import clsx from 'clsx'
import TagFormRow from './TagFormRow'

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

  // STATES
  const [nodeIds, setNodeIds] = useState([])
  const [nodes, setNodes] = useState({})
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState({})

  // used to throttle changes to redux changes state and keep input fast
  const [localChange, setLocalChange] = useState(false)
  // used to rebuild fields for when the type changes
  const [type, setType] = useState(null)

  const { entities, entityType } = useFocusedEntities(projectName)
  const { data: projectsInfo = {} } = useGetProjectsInfoQuery({ projects: [projectName] })

  // now we get the full details data for selected entities
  let entitiesToQuery = entities.length
    ? entities.map((entity) => ({ id: entity.id, projectName: entity.projectName }))
    : []

  const {
    data: detailsData = [],
    isFetching: isFetchingEntitiesDetails,
    isSuccess,
    isError,
    refetch,
    // originalArgs,
  } = useGetEntitiesDetailsPanelQuery(
    { entityType, entities: entitiesToQuery, projectsInfo },
    { skip: !entitiesToQuery.length || !entityDetailsTypesSupported.includes(entityType) },
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
  const hasLeaf = nodeIds.some((id) => nodes[id]?.leaf && nodes[id]?.data?.__entityType === 'task')
  const types = getTypes(nodes, nodeIds)

  useEffect(() => {
    // resets every time selection is changed
    // changes saved to global state will show up here
    setForm(createInitialForm(types, { nodeIds, nodes, attribs, changes, setType }))
  }, [nodeIds, type, editorNodes])

  // every time local form changes, update global state
  // throttle changes to improve perf
  useEffect(() => {
    // check if the change was local or global
    if (!localChange) return

    // check what local changes have been made and syncs with global state throttle this
    handleFormChanged(form, changes, { nodeIds, nodes, setLocalChange, onChange, onRevert })
  }, [form, nodes, changes])

  //Handlers
  const handleRevert = () => {
    // revert global state
    onRevert(nodes)
    // revert local form by updating triggering createInitialForm useEffect
    setNodeIds([...nodeIds])
  }

  // save and sync changes with table (global redux)
  // we throttle this to keep things fast
  const handleForceSave = (e) => {
    // we save input straight away with meta + enter key
    if ((e.metaKey || e.ctrl) && e.key === 'Enter') {
      const value = e.target.value
      const changeKey = e.target.id
      onForceChange(changeKey, value, nodeIds, type)
    }
  }
  const handleUploaded = (operations) => {
    for (const operation of operations) {
      const { id, updatedAt } = {
        id: operation.id,
        updatedAt: operation?.data?.updatedAt,
      }
      setNodes((prev) => {
        let updatedEntity = {
          ...prev[id],
          data: { ...prev[id]?.data, updatedAt: updatedAt },
        }
        return { ...prev, [id]: updatedEntity }
      })
    }

    refetch()
  }

  return (
    <Section wrap id="editor-entity-details-container">
      {!noSelection && (
        <>
          <EntityThumbnailUploader
            isCompact
            entities={isFetchingEntitiesDetails ? entitiesToQuery : entityDetailsData}
            projectName={projectName}
            entityType={entityType}
            onUploaded={handleUploaded}
          >
            <EntityDetailsHeader
              values={nodeIds.map((id) => nodes[id]?.data)}
              entityType={entityType}
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

                  const changedStyles = {
                    backgroundColor: isChanged ? 'var(--color-changed)' : 'initial',
                    color: isChanged ? 'var(--color-on-changed)' : 'initial',
                  }

                  const borderDynamicStyles = {
                    border: isChanged
                      ? '3px solid var(--md-sys-color-primary)'
                      : '1px solid var(--md-sys-color-outline-variant)',
                  }

                  const disabledStyles = disabled ? { opacity: 0.7, fontStyle: 'italic' } : {}

                  let input

                  if (field === 'name' && !isNew) {
                    input = <InputText value={value} disabled readOnly />
                  } else if (field.includes('Type')) {
                    input = (
                      <TypeEditor
                        value={multipleValues ? multipleValues : [value]}
                        onChange={(v) =>
                          handleLocalChange(v, changeKey, field, {
                            form,
                            nodeIds,
                            nodes,
                            setLocalChange,
                            setForm,
                          })
                        }
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
                        onChange={(v) =>
                          handleLocalChange(v, changeKey, field, {
                            form,
                            nodeIds,
                            nodes,
                            setLocalChange,
                            setForm,
                          })
                        }
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
                        onChange={(v) =>
                          handleLocalChange(v, changeKey, field, {
                            form,
                            nodeIds,
                            nodes,
                            setLocalChange,
                            setForm,
                          })
                        }
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
                      <TagFormRow
                        value={multipleValues ? union(...multipleValues) : value || []}
                        isChanged={isChanged}
                        isMultiple={!!multipleValues}
                        onChange={(value) =>
                          handleLocalChange(value, changeKey, field, {
                            form,
                            nodeIds,
                            nodes,
                            setLocalChange,
                            setForm,
                          })
                        }
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
                          handleLocalChange(isMultiSelect ? v : v[0], changeKey, field, {
                            form,
                            nodeIds,
                            nodes,
                            setLocalChange,
                            setForm,
                          })
                        }
                        multiSelect={isMultiSelect}
                        widthExpand
                        emptyMessage={`Select option${isMultiSelect ? 's' : ''}...`}
                        multipleValues={!!multipleValues}
                        onClear={
                          field !== 'attrib.tools'
                            ? (value) =>
                                handleLocalChange(value, changeKey, field, {
                                  form,
                                  nodeIds,
                                  nodes,
                                  setLocalChange,
                                  setForm,
                                })
                            : undefined
                        }
                        onClearNull={(value) =>
                          handleLocalChange(value, changeKey, field, {
                            form,
                            nodeIds,
                            nodes,
                            setLocalChange,
                            setForm,
                          })
                        }
                        nullPlaceholder="(inherited)"
                        search={attrib?.enum?.length > 10}
                      />
                    )
                  } else if (isDate) {
                    value = value ? new Date(value) : value
                    input = (
                      <InputDate
                        selected={value || undefined}
                        disabled={(hasLeaf && leafDisabled) || disabled}
                        onChange={(date) =>
                          handleLocalChange(date, changeKey, field, {
                            form,
                            nodeIds,
                            nodes,
                            setLocalChange,
                            setForm,
                          })
                        }
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
                        onChange={(e) =>
                          handleLocalChange(e.target.checked, changeKey, field, {
                            form,
                            nodeIds,
                            nodes,
                            setLocalChange,
                            setForm,
                          })
                        }
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
                        onChange={(e) =>
                          handleLocalChange(e.target.value, changeKey, field, {
                            form,
                            nodeIds,
                            nodes,
                            setLocalChange,
                            setForm,
                          })
                        }
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

                  if (!input) {
                    return null
                  }

                  return (
                    <FormRow
                      key={i}
                      label={label}
                      className={clsx('editor-form', field, attrib?.type, {
                        disabled,
                        isChanged,
                        inherited: !isOwn,
                        multipleValues: multipleValues,
                      })}
                      fieldStyle={{
                        overflow: !isDate ? 'hidden' : 'visible',
                      }}
                    >
                      <SubRow className={isChanged ? 'isChanged' : ''}>
                        {input}
                        {attrib && !['name', 'label'].includes(field) && isOwn && (
                          <Button
                            onClick={() =>
                              handleLocalChange(null, changeKey, field, {
                                form,
                                nodeIds,
                                nodes,
                                setLocalChange,
                                setForm,
                              })
                            }
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
          </EntityThumbnailUploader>
        </>
      )}
    </Section>
  )
}

export default EditorPanel
