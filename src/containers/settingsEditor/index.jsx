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

const SettingsEditor = ({
  schema,
  formData,
  onChange,
  overrides,
  onSetBreadcrumbs,
}) => {
  if (!schema) {
    return <div>Loading schema...</div>
  }

  const formContext = {
    overrides: overrides || {},
    changedKeys: [],
    onSetBreadcrumbs,
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
