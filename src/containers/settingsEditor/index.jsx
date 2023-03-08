import Form from '@rjsf/core'
import { useMemo } from 'react'

import { Tooltip } from 'primereact/tooltip'
import { TextWidget, SelectWidget, CheckboxWidget } from './widgets'
import { FieldTemplate, ObjectFieldTemplate, ArrayFieldTemplate } from './fields'
import './index.sass'

import styled from 'styled-components'

const FormWrapper = styled.div`
  [data-fieldid="${(props) => props.currentSelection}"]{
    border-left: 1px solid var(--color-hl-00) !important;
    border-radius: 4px;
    background-color: rgba(0,0,0,.2);
  }
}
`

const widgets = {
  TextWidget,
  SelectWidget,
  CheckboxWidget,
}

// Just close the top-level object to a simple div
const uiSchema = {
  'ui:FieldTemplate': (props) => <div className="form-root-field">{props.children}</div>,
}

const buildOverrides = (formData, saveOriginalValue = false) => {
  let result = {}

  const crawl = (obj, path = []) => {
    for (const key in obj) {
      const value = obj[key]
      const newPath = path.concat(key)
      const objId = `root_${newPath.join('_')}`
      if (typeof value === 'object') {
        result[objId] = {
          path: newPath,
          type: Array.isArray(value) ? 'array' : 'branch',
          level: 'default',
        }
        crawl(value, newPath)
      } else {
        result[objId] = {
          path: newPath,
          type: 'leaf',
          level: 'default',
          value: value,
        }
        if (saveOriginalValue) {
          result[objId].originalValue = value
        }
      }
    }
  }

  crawl(formData)
  return result
}

const noop = () => {}

const SettingsEditor = ({
  schema,
  originalData,
  formData,
  onChange,
  overrides,
  breadcrumbs,
  onSetBreadcrumbs,
  onSetChangedKeys,
  level,
  changedKeys,
}) => {
  if (!schema) {
    // TODO: maybe a spinner or something?
    return <div></div>
  }

  const originalOverrides = useMemo(() => buildOverrides(originalData, true), [originalData])

  const formContext = useMemo(() => {
    const formOverrides = buildOverrides(formData)
    for (const key in formOverrides) {
      if (formOverrides[key].type === 'leaf') {
        formOverrides[key].originalValue = originalOverrides[key]?.originalValue
      }
    }

    return {
      overrides: formOverrides,
      changedKeys: changedKeys || [],
      level: level || 'studio',

      onSetBreadcrumbs: null,
      onSetChangedKeys: null,
      breadcrumbs: [],
    }
  }, [schema, formData, overrides, level, changedKeys])

  //console.log("formContext", formContext)

  formContext.onSetBreadcrumbs = onSetBreadcrumbs || noop
  formContext.onSetChangedKeys = onSetChangedKeys || noop
  formContext.breadcrumbs = breadcrumbs || []

  const currentId = breadcrumbs && `root_${breadcrumbs.join('_')}`

  return (
    <FormWrapper currentSelection={currentId}>
      <Form
        schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        formContext={formContext}
        widgets={widgets}
        liveValidate={true}
        FieldTemplate={FieldTemplate}
        ObjectFieldTemplate={ObjectFieldTemplate}
        ArrayFieldTemplate={ArrayFieldTemplate}
        onChange={(evt) => onChange(evt.formData)}
      >
        <div />
      </Form>
      <Tooltip target=".form-inline-field-label" />
    </FormWrapper>
  )
}

export default SettingsEditor
