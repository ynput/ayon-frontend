import Form from '@rjsf/core'

import { Tooltip } from 'primereact/tooltip'
import { TextWidget, SelectWidget, CheckboxWidget } from './widgets'
import {
  FieldTemplate,
  ObjectFieldTemplate,
  ArrayFieldTemplate,
} from './fields'
import './index.sass'

const widgets = {
  TextWidget,
  SelectWidget,
  CheckboxWidget,
}

// Just close the top-level object to a simple div
const uiSchema = {
  'ui:FieldTemplate': (props) => (
    <div className="form-root-field">{props.children}</div>
  ),
}

const buildOverrides = (formData) => {
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
      }
    }
  }

  crawl(formData)
  return result
}

const SettingsEditor = ({
  schema,
  formData,
  onChange,
  overrides,
  onSetBreadcrumbs,
  onSetChangedKeys,
  level,
  changedKeys,
}) => {
  if (!schema) {
    // TODO: maybe a spinner or something?
    return <div></div>
  }

  const formContext = {
    overrides: { ...buildOverrides(formData), ...(overrides || {}) },
    level: level || 'studio',
    onSetBreadcrumbs: onSetBreadcrumbs || (() => {}),
    changedKeys: changedKeys || [], // source of all problems
    onSetChangedKeys: onSetChangedKeys || (() => {}),
  }

  return (
    <>
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
        children={<></>}
      />
      <Tooltip target=".form-inline-field-label" />
    </>
  )
}

export default SettingsEditor
