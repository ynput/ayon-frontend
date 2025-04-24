import clsx from 'clsx'
import { toast } from 'react-toastify'
import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import SettingsPanel from '../SettingsPanel'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'

import { Badge, BadgeWrapper } from '@components/Badge'
import copyToClipboard from '@helpers/copyToClipboard'
import { $Any } from '@types'
import { ObjectFieldTemplateProps } from '@rjsf/utils'
import { matchesFilterKeys } from './searchMatcher'

const arrayStartsWith = (arr1: $Any, arr2: $Any) => {
  // return true, if first array starts with second array
  if ((arr2 || []).length > (arr1 || []).length) return false
  if ((arr2 || []).length === 0) return true
  for (let i = 0; i < arr2.length; i++) {
    if (arr1[i] !== arr2[i]) return false
  }
  return true
}

function ObjectFieldTemplate(props: { id: string } & ObjectFieldTemplateProps) {
  const [contextMenu] = useCreateContextMenu([])
  let className = 'form-object-field'
  if (props.schema.layout) className += ` layout-${props.schema.layout}`

  // Highlight overrides and changed fields

  const objId = props.idSchema.$id
  const override = props.formContext.overrides[objId]
  const path = override?.path

  const overrideLevel = useMemo(() => {
    // check whether a child object is changed locally
    for (const changedPath of props.formContext.changedKeys) {
      if (arrayStartsWith(changedPath, path)) {
        return 'edit'
      }
    }

    for (const changedId in props.formContext.overrides) {
      const changedPath = props.formContext.overrides[changedId].path
      if (arrayStartsWith(changedPath, path)) {
        return props.formContext.overrides[changedId].level
      }
    }

    return 'default'
  }, [path, props.formContext.changedKeys, props.formContext.overrides])

  if (props.schema.isgroup && overrideLevel === 'edit') {
    className += ' group-changed'
  }

  // Object description (from docstrings)

  const shortDescription = props.schema.description && props.schema.description.split('\n')[0]

  const longDescription = useMemo(() => {
    if (!props.schema.description) return null
    return (
      <div className="form-object-field-help">
        <ReactMarkdown>{props.schema.description}</ReactMarkdown>
      </div>
    )
  }, [props.schema.description])

  // memoize the fields

  const enabledToggler = useMemo(() => {
    for (const element of props.properties) {
      if (element?.name === 'enabled') {
        return <span className="form-object-header-enabled-toggler">{element.content}</span>
      }
    }
  }, [props.properties])

  const fields = useMemo(() => {
    let hiddenFields: $Any[] = []
    for (const propName in props?.schema?.properties || {}) {
      //@ts-ignore
      const ppts = props?.schema?.properties[propName]
      //@ts-ignore
      if (!(ppts.scope || ['studio', 'project']).includes(props.formContext.level)) {
        hiddenFields.push(propName)
      }
      //@ts-ignore
      if (ppts.conditionalEnum) {
        hiddenFields = [
          ...hiddenFields,
          //@ts-ignore
          ...(ppts?.enum || []).filter((e: $Any) => e !== props.formData?.[propName]),
        ]
      }
    }

    if (props.schema.layout === 'expanded') {
      let nameField = null
      let otherFields = []

      for (const element of props.properties) {
        if (element?.name === 'name') nameField = element.content
        else otherFields.push(element.content)
      }
      return (
        <div style={{ width: '100%' }}>
          {longDescription}
          <div className={className}>
            <div className="name-field">{nameField}</div>
            <div className="data-fields">
              {otherFields
                .filter((f) => !hiddenFields.includes(f.props.name))
                .map((element) => element)}
            </div>
          </div>
        </div>
      )
    } // ugly layout

    const matches = matchesFilterKeys(
      props.formContext.searchText,
      props.formContext.filterKeys,
      props.formContext.addonName,
      props.idSchema.$id,
    )

    return (
      <div
        data-hidden={matches ? 'false' : 'true'}
        style={{
          visibility: matches ? 'visible' : 'hidden',
          position: matches ? 'relative' : 'absolute',
          height: matches ? 'auto' : 0,
        }}
      >
        {longDescription}
        <div className={className} data-test="test-aa" data-fieldid={props.id}>
          {props.properties
            .filter(
              (element) =>
                (element.name !== 'enabled' || ['compact', 'root'].includes(props.schema.layout)) &&
                !hiddenFields.includes(element.name),
            )
            .map((element, index) => {
              let widget = element.content.props?.schema?.widget
              widget = widget || (element.content.props?.name === 'shortName' ? 'short' : null)
              return (
                <div
                  key={index}
                  className={clsx('form-object-field-item', widget && `widget-${widget}`)}
                >
                  {element.content}
                </div>
              )
            })}
        </div>
      </div>
    )
  }, [props.properties, className])

  // aaand... render

  if (['compact', 'root', 'expanded'].includes(props.schema.layout)) return fields

  const contextMenuModel = useMemo(() => {
    let model = []

    if (props.idSchema.$id === 'root') {
      model.push({
        label: `Remove all ${props.formContext.level} overrides`,
        disabled: !props.formContext.onRemoveAllOverrides,
        command: () => {
          props.formContext.onRemoveAllOverrides()
        },
      })
    } else {
      const rmPath = override?.inGroup || path || ['root']
      if (props.formContext.onPinOverride)
        model.push({
          label: `Add current ${rmPath[rmPath.length - 1]} value as ${
            props.formContext.level
          } override`,
          command: () => props.formContext.onPinOverride(rmPath),
          disabled: overrideLevel === props.formContext.level,
        })
      if (props.formContext.onRemoveOverride)
        model.push({
          label: `Remove ${props.formContext.level} override from ${rmPath[rmPath.length - 1]}`,
          command: () => props.formContext.onRemoveOverride(rmPath),
          disabled: overrideLevel !== props.formContext.level,
        })
    }

    model.push(
      {
        label: 'Copy',
        command: () => {
          if (!props.formData || (Array.isArray(props.formData) && props.formData.length === 0)) {
            console.log('No data to copy', props)
            toast.warn('No data to copy')
            return
          }
          copyToClipboard(JSON.stringify(props.formData, null, 2))
        },
      },
      {
        label: 'Paste',
        disabled: !props.formContext.onPasteValue,
        command: () => {
          props.formContext.onPasteValue(path || [])
        },
      },
    )
    return model
  }, [override, overrideLevel, path, props.formData])

  // Title + handle root object

  let stringTitle = props.title
  let rootTitle
  let titleComponent
  // In case of "pseudo-dicts" (array of objects with a "name" attribute)
  // use the "name" attributeas the title

  if (!props.schema?.properties) {
    console.warn(`object schema does not have any props:`, props.schema)
  }

  if ('name' in (props.schema.properties || {})) {
    let label = null
    if ('label' in (props.schema.properties || {})) label = props.formData.label
    stringTitle = label || props.formData?.name || <span className="new-object">Unnamed item</span>
  }

  if (props.idSchema.$id === 'root' && props.formContext.formTitle) {
    stringTitle = props.formContext.formTitle
  }

  if (props.idSchema.$id === 'root') {
    const projectMark = props.formContext.headerProjectName && (
      <Badge hl="project" style={{}}>
        {props.formContext.headerProjectName}
      </Badge>
    )
    const siteMark = props.formContext.headerSiteId && (
      <Badge hl="site" style={{}}>
        {props.formContext.headerSiteId}
      </Badge>
    )

    const envMark = props.formContext.headerVariant && (
      <Badge
        hl={
          ['production', 'staging'].includes(props.formContext.headerVariant)
            ? props.formContext.headerVariant
            : 'developer'
        }
        style={{}}
      >
        {props.formContext.headerVariant}
      </Badge>
    )

    rootTitle = (
      <>
        {stringTitle}
        <BadgeWrapper>
          {projectMark}
          {siteMark}
          {envMark}
        </BadgeWrapper>
      </>
    )
  } // Root object - show badges and title

  titleComponent = props.idSchema.$id === 'root' ? rootTitle : stringTitle

  // Execute context menu

  const onContextMenu = (e: $Any) => {
    if (props.formContext.onSetBreadcrumbs) props.formContext.onSetBreadcrumbs(path || [])
    if (!contextMenuModel?.length) return
    e.preventDefault()
    contextMenu(e, contextMenuModel)
  }

  const matches = matchesFilterKeys(
    props.formContext.searchText,
    props.formContext.filterKeys,
    props.formContext.addonName,
    props.idSchema.$id,
  )

  return (
    <div
      data-schema-id={props.idSchema.$id}
      data-hidden={matches ? 'false' : 'true'}
      style={{
        visibility: matches ? 'visible' : 'hidden',
        position: matches ? 'relative' : 'absolute',
        height: matches ? 'auto' : 0,
      }}
    >
      <SettingsPanel
        objId={objId}
        onClick={() => {
          if (props.formContext.onSetBreadcrumbs) props.formContext.onSetBreadcrumbs(path)
        }}
        title={titleComponent}
        description={shortDescription}
        className={`obj-override-${overrideLevel}`}
        enabledToggler={enabledToggler}
        onContextMenu={onContextMenu}
        currentId={props.formContext.currentId}
        layout={undefined}
      >
        {fields}
      </SettingsPanel>
    </div>
  )
}

export default ObjectFieldTemplate
