import { useMemo } from 'react'
import { toast } from 'react-toastify'
import { Button, Divider } from '@ynput/ayon-react-components'
import ReactMarkdown from 'react-markdown'
import SettingsPanel from './SettingsPanel'
import styled from 'styled-components'
import useCreateContext from '/src/hooks/useCreateContext'

import { isEqual } from 'lodash'
import { Badge, BadgeWrapper } from '/src/components/Badge'

const FormArrayField = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const FormArrayFieldItem = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: row;
  gap: 8px;

  margin-right: 4px;

  .panel-content {
    flex-grow: 1;
  }
`

const ArrayItemControls = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  gap: 5px;

  button {
    border-radius: 50%;
    width: 30px;
    height: 30px;
  }
`

const arrayStartsWith = (arr1, arr2) => {
  // return true, if first array starts with second array
  if ((arr2 || []).length > (arr1 || []).length) return false
  if ((arr2 || []).length === 0) return true
  for (let i = 0; i < arr2.length; i++) {
    if (arr1[i] !== arr2[i]) return false
  }
  return true
}

const arrayContainsArray = (arr1, arr2) => {
  return arr1.some((el) => isEqual(el, arr2))
}

function ObjectFieldTemplate(props) {
  const [contextMenu] = useCreateContext([])
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

  // Object descrtiption (from docstrings)

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
      if (element.name === 'enabled') {
        return <span className="form-object-header-enabled-toggler">{element.content}</span>
      }
    }
  }, [props.properties])

  const fields = useMemo(() => {
    let hiddenFields = []
    for (const propName in props?.schema?.properties || {}) {
      const ppts = props?.schema?.properties[propName]
      if (!(ppts.scope || ['studio', 'project']).includes(props.formContext.level)) {
        hiddenFields.push(propName)
      }
      if (ppts.conditionalEnum) {
        hiddenFields = [
          ...hiddenFields,
          ...(ppts?.enum || []).filter((e) => e !== props.formData[propName]),
        ]
      }
    }

    if (props.schema.layout === 'expanded') {
      let nameField = null
      let otherFields = []

      for (const element of props.properties) {
        if (element.name === 'name') nameField = element.content
        else otherFields.push(element.content)
      }
      return (
        <>
          {longDescription}
          <div className={className}>
            <div className="name-field">{nameField}</div>
            <div className="data-fields">
              {otherFields
                .filter((f) => !hiddenFields.includes(f.props.name))
                .map((element) => element)}
            </div>
          </div>
        </>
      )
    } // ugly layout

    return (
      <>
        {longDescription}
        <div className={className}>
          {props.properties
            .filter(
              (element) =>
                (element.name !== 'enabled' || ['compact', 'root'].includes(props.schema.layout)) &&
                !hiddenFields.includes(element.name),
            )
            .map((element, index) => (
              <div key={index} className="form-object-field-item">
                {element.content}
              </div>
            ))}
        </div>
      </>
    )
  }, [props.properties, className])

  // aaand... render

  if (['compact', 'root', 'expanded'].includes(props.schema.layout)) return fields

  const contextMenuItems = [
    {
      label: 'Copy',
      command: () => {
        navigator.clipboard.writeText(JSON.stringify(props.formData, null, 2))
        toast.success('Copied to clipboard')
      },
    },
    {
      label: 'Paste',
      disabled: !props.formContext.onPasteValue,
      command: () => {
        props.formContext.onPasteValue(path || [])
      },
    },
  ]

  // Title + handle root object

  let title = props.title
  // In case of "pseudo-dicts" (array of objects with a "name" attribute)
  // use the "name" attributeas the title
  if ('name' in props.schema.properties) {
    let label = null
    if ('label' in props.schema.properties) label = props.formData.label
    title = label || props.formData.name || <span className="new-object">Unnamed item</span>
  }

  if (props.idSchema.$id === 'root' && props.formContext.formTitle)
    title = props.formContext.formTitle

  if (props.idSchema.$id === 'root') {
    const projectMark = props.formContext.headerProjectName && (
      <Badge hl="project">{props.formContext.headerProjectName}</Badge>
    )
    const siteMark = props.formContext.headerSiteId && (
      <Badge hl="site">{props.formContext.headerSiteId}</Badge>
    )

    const envMark = props.formContext.headerVariant && (
      <Badge
        hl={
          ['production', 'staging'].includes(props.formContext.headerVariant)
            ? props.formContext.headerVariant
            : 'developer'
        }
      >
        {props.formContext.headerVariant}
      </Badge>
    )

    title = (
      <>
        {title}
        <BadgeWrapper>
          {projectMark}
          {siteMark}
          {envMark}
        </BadgeWrapper>
      </>
    )

    contextMenuItems.push({
      label: `Remove all ${props.formContext.level} overrides`,
      disabled: !props.formContext.onRemoveAllOverrides,
      command: () => {
        props.formContext.onRemoveAllOverrides()
      },
    })
  }

  // Execute context menu

  const onContextMenu = (e) => {
    if (props.formContext.onSetBreadcrumbs) props.formContext.onSetBreadcrumbs(path || [])
    if (!contextMenuItems?.length) return
    e.preventDefault()
    contextMenu(e, contextMenuItems)
  }

  return (
    <SettingsPanel
      objId={objId}
      onClick={() => {
        if (props.formContext.onSetBreadcrumbs) props.formContext.onSetBreadcrumbs(path)
      }}
      title={title}
      description={shortDescription}
      className={`obj-override-${overrideLevel}`}
      enabledToggler={enabledToggler}
      onContextMenu={onContextMenu}
    >
      {fields}
    </SettingsPanel>
  )
}

function FieldTemplate(props) {
  const [contextMenu] = useCreateContext([])

  // Do not render the field if it belongs to a different scope (studio/project/local) or if it is hidden
  if (!(props.schema.scope || ['studio', 'project']).includes(props.formContext.level)) return null

  const divider = useMemo(() => {
    if (props.schema.section)
      return <Divider>{props.schema.section !== '---' && props.schema.section}</Divider>
    else return <></>
  }, [props.schema.section])

  // Object fields

  if (props.schema.type === 'object') {
    return (
      <>
        {divider}
        {props.children}
      </>
    )
  }

  // Solve overrides for lists and leaves

  const override = props.formContext.overrides ? props.formContext.overrides[props.id] : null
  const path = override?.path || []

  const fieldChanged = useMemo(() => {
    return arrayContainsArray(props.formContext.changedKeys, path)
  }, [props.formContext.changedKeys, path])

  const overrideLevel = fieldChanged ? 'edit' : override?.level || 'default'
  let labelStyle = {}

  if (override) {
    if (override?.inGroup) labelStyle.fontStyle = 'italic'
  }

  // Context menu

  const contextMenuModel = useMemo(() => {
    let model = [
      {
        label: `Remove ${props.formContext.level} override`,
        disabled: overrideLevel !== props.formContext.level || !props.formContext.onRemoveOverride,
        command: () => props.formContext.onRemoveOverride(path),
      },
      {
        label: `Pin current value as ${props.formContext.level} override`,
        disabled: overrideLevel === props.formContext.level || !props.formContext.onRemoveOverride,
        command: () => props.formContext.onPinOverride(path),
      },
      {
        label: 'Copy value',
        disabled: !props.formContext.onCopyValue,
        command: () => {
          navigator.clipboard.writeText(JSON.stringify(props.formData, null, 2))
          toast.success('Copied to clipboard')
        },
      },
      {
        label: 'Paste value',
        disabled: !props.formContext.onPasteValue,
        command: () => props.formContext.onPasteValue(path),
      },
    ]

    return model
  }, [override, path])

  const onContextMenu = (e) => {
    e.preventDefault()
    contextMenu(e, contextMenuModel)
    if (props.formContext.onSetBreadcrumbs && path) props.formContext.onSetBreadcrumbs(path)
  }

  // Array fields

  if (
    props.schema.type === 'array' &&
    props.schema.items.type !== 'string' &&
    props.schema.layout !== 'compact'
  ) {
    let classes = []

    for (const changedPath of props.formContext.changedKeys) {
      if (arrayStartsWith(changedPath, path)) {
        classes.push('obj-override-edit')
        classes.push('group-changed')
        break
      }
    }

    if (!classes.includes('obj-override-edit')) classes.push(`obj-override-${overrideLevel}`)

    return (
      <SettingsPanel
        objId={props.id}
        title={props.schema.title}
        description={props.schema.description}
        className={classes.join(' ')}
        onMouseUp={() => {
          if (props.formContext.onSetBreadcrumbs && path) props.formContext.onSetBreadcrumbs(path)
        }}
        onContextMenu={onContextMenu}
      >
        {props.children}
      </SettingsPanel>
    )
  }

  // Leaves

  const widgetClass =
    props.schema.type === 'array' && props.schema.layout === 'compact' && props.formData?.length
      ? 'left-border'
      : ''

  // do not show error for color widgets (they are declared as strings, but
  // contains arrays. The error is not relevant for the user)
  //
  // TODO: ignoring errors for now. Too many false positives
  let className = `form-inline-field`
  // let className = `form-inline-field ${
  //   props.errors.props.errors && props.schema.widget !== 'color' ? 'error' : ''
  // }`

  const inlineHelp = useMemo(() => {
    return (
      props.rawDescription && (
        <div>
          <ReactMarkdown>{props.rawDescription}</ReactMarkdown>
        </div>
      )
    )
  }, [props.rawDescription])

  return (
    <>
      {divider}
      <div className={className} data-fieldid={props.id} onContextMenu={onContextMenu}>
        {props.label && (
          <div className={`form-inline-field-label ${overrideLevel}`}>
            <span
              onClick={() => {
                if (props.formContext.onSetBreadcrumbs) {
                  if (override?.path) props.formContext.onSetBreadcrumbs(override.path)
                }
              }}
              style={labelStyle}
            >
              {props.label}
            </span>
          </div>
        )}
        <div className={`form-inline-field-widget ${widgetClass}`}>{props.children}</div>
        <div className="form-inline-field-help">{inlineHelp}</div>
      </div>
    </>
  )
}

const ArrayItemTemplate = (props) => {
  const parentSchema = props?.children?._owner?.memoizedProps?.schema || {}
  const itemName = props?.children?.props?.formData?.name
  let undeletable = false

  const children = props.children

  if (itemName && (parentSchema.requiredItems || []).includes(itemName)) {
    undeletable = true
    // TODO: Store this information elsewhere. since swithcing to RTK query
    // schema props are immutable! use form context maybe?

    //if (children.props.formData.name === itemName)
    //  children.props.schema.properties.name.fixedValue = itemName
  }

  const onArrayChanged = () => {
    const parentId = props.children.props.idSchema.$id.split('_').slice(0, -1).join('_')
    const formContext = props.children._owner.memoizedProps.formContext
    const path = formContext.overrides[parentId].path
    formContext.onSetChangedKeys([{ path, isChanged: true }])
  }

  const onRemoveItem = () => {
    onArrayChanged()
    const r = props.onDropIndexClick(props.index)
    r()
  }

  const onMoveUp = () => {
    onArrayChanged()
    const r = props.onReorderClick(props.index, props.index - 1)
    r()
  }

  const onMoveDown = () => {
    onArrayChanged()
    const r = props.onReorderClick(props.index, props.index + 1)
    r()
  }

  const rmButton = props.hasRemove && (
    <ArrayItemControls>
      <Button onClick={onRemoveItem} icon="close" disabled={undeletable} />
      <Button onClick={onMoveUp} icon="arrow_upward" />
      <Button onClick={onMoveDown} icon="arrow_downward" />
    </ArrayItemControls>
  )

  return (
    <FormArrayFieldItem>
      {children}
      {rmButton}
    </FormArrayFieldItem>
  )
}

const ArrayFieldTemplate = (props) => {
  /* Complete array including the add button */

  const onAddItem = () => {
    const id = props.idSchema.$id
    const formContext = props.formContext
    const path = formContext.overrides[id]?.path

    formContext.onSetChangedKeys([{ path, isChanged: true }])
    props.onAddClick()
  }

  return (
    <FormArrayField>
      {props.items.map((element) => (
        <>
          <ArrayItemTemplate key={element.key} {...element} />
        </>
      ))}

      {props.canAdd && (
        <ArrayItemControls>
          <Button onClick={onAddItem} icon="add" />
        </ArrayItemControls>
      )}
    </FormArrayField>
  )

  /*
   * THIS IS THE ORIGINAL CODE,
   * apparently we cannot memoize this
  const res = useMemo(
    () => (
      <FormArrayField>
        {props.items.map((element) => (
          <ArrayItemTemplate key={element.name} {...element} />
        ))}

        {props.canAdd && (
          <ArrayItemControls>
            <Button onClick={onAddItem} icon="add" />
          </ArrayItemControls>
        )}
      </FormArrayField>
    ),
    [props.items, props.canAdd],
  )

  return res
  */
}

export { ObjectFieldTemplate, FieldTemplate, ArrayFieldTemplate }
