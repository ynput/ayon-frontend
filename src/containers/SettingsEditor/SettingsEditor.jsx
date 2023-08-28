import Form from '@rjsf/core'
import { useMemo } from 'react'
import styled from 'styled-components'

import { TextWidget, SelectWidget, CheckboxWidget, DateTimeWidget } from './widgets'
import { FieldTemplate, ObjectFieldTemplate, ArrayFieldTemplate } from './fields'
import './SettingsEditor.sass'

const FormWrapper = styled.div`
  [data-fieldid='${(props) => props.currentSelection}'] {
    border-left: 1px solid var(--color-changed) !important;
    border-radius: 4px;
    background-color: rgba(0, 0, 0, 0.2);
  }

  .rjsf {
    flex-grow: 1;
    margin: 0;
    padding: 0;

    .form-root-field {
      animation-name: delay-visibility;
      animation-duration: 0.4s;
      animation-fill-mode: forwards;
      opacity: 0;

      @keyframes delay-visibility {
        to {
          opacity: 1;
        }
      }
    }

    .errors {
      display: none;
    }

    .switch-body {
      .slider {
        transition-duration: 0s;

        &::before {
          transition-duration: 0s;
        }
      }
    }
  }
`

const widgets = {
  TextWidget,
  SelectWidget,
  CheckboxWidget,
  DateTimeWidget,
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
          //level: 'default',
        }
        crawl(value, newPath)
      } else {
        result[objId] = {
          path: newPath,
          type: 'leaf',
          //level: 'default',
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
  context,
}) => {
  if (!schema) {
    // TODO: maybe a spinner or something?
    return <div></div>
  }

  const originalOverrides = useMemo(() => {
    const result = buildOverrides(originalData, true)
    for (const key in overrides) {
      if (!(key in result)) result[key] = {}
      result[key].level = overrides[key].level
      result[key].inGroup = overrides[key].inGroup
    }
    return result
  }, [originalData, overrides])

  const formContext = useMemo(() => {
    const formOverrides = buildOverrides(formData)

    for (const key in formOverrides) {
      if (key in (overrides || {})) {
        if (!formOverrides[key]) formOverrides[key] = {}
        formOverrides[key].level = overrides[key]?.level || 'default'
        formOverrides[key].inGroup = overrides[key]?.inGroup || false
      }
      if (formOverrides[key].type === 'leaf') {
        formOverrides[key].originalValue = originalOverrides[key]?.originalValue
      }
    }

    return {
      overrides: formOverrides,
      changedKeys: changedKeys || [],
      level: level || 'studio',
    }
  }, [schema, formData, overrides, level, changedKeys])

  // we need to add the props.context to form context independently
  // otherwise it breaks memoized overrides

  const fullContext = {
    ...context,
    ...formContext,
    onSetChangedKeys: onSetChangedKeys || noop,
    onSetBreadcrumbs: onSetBreadcrumbs || noop,
    breadcrumbs: breadcrumbs || [],
  }

  const currentId = breadcrumbs && `root_${breadcrumbs.join('_')}`

  return (
    <FormWrapper currentSelection={currentId}>
      <Form
        schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        formContext={fullContext}
        widgets={widgets}
        liveValidate={true}
        FieldTemplate={FieldTemplate}
        ObjectFieldTemplate={ObjectFieldTemplate}
        ArrayFieldTemplate={ArrayFieldTemplate}
        onChange={(evt) => onChange(evt.formData)}
      >
        <div />
      </Form>
    </FormWrapper>
  )
}

export default SettingsEditor
