import Form from '@rjsf/core'

import { Accordion, AccordionTab } from 'primereact/accordion'

import compactListUiSchema from './compactList'
import templateGroupUiSchema from './templateGroup'
import customFields from './customFields'

import './anatomy.sass'

const WrapperTemplate = (props) => {
  return (
    <Accordion multiple transitionOptions={{ timeout: 0 }}>
      {props.properties.map((element) => {
        return (
          <AccordionTab
            key={element.name}
            header={element.content.props.schema.title}
          >
            <>{element.content}</>
          </AccordionTab>
        )
      })}
    </Accordion>
  )
}

const TopLevelObjectFieldTemplate = (props) => {
  return <div>{props.properties.map((element) => element.content)}</div>
}

const SettingsFieldTemplate = (props) => {
  if (props.displayLabel)
    return (
      <div className="settings-field">
        <div className="p-inputgroup">
          {props.displayLabel && (
            <span className="p-inputgroup-addon settings-field-label">
              {props.label}{' '}
            </span>
          )}
          {props.children}
        </div>
      </div>
    )

  return props.children
}

const AnatomyEditor = ({ schema, formData, onChange }) => {
  const topLevelFields = {
    'ui:ObjectFieldTemplate': TopLevelObjectFieldTemplate,
  }

  const uischema = {
    'ui:rootFieldId': 'jform',
    'ui:ObjectFieldTemplate': WrapperTemplate,
    roots: compactListUiSchema,

    templates: {
      ...topLevelFields,
      work: templateGroupUiSchema,
      render: templateGroupUiSchema,
      publish: templateGroupUiSchema,
      hero: templateGroupUiSchema,
      delivery: templateGroupUiSchema,
      others: templateGroupUiSchema,
    },

    attributes: {
      ...topLevelFields,
      applications: {
        'ui:field': 'multiselect',
      },
    },

    folder_types: compactListUiSchema,
    task_types: compactListUiSchema,
  }

  return (
    <>
      {schema && (
        <Form
          schema={schema}
          formData={formData}
          uiSchema={uischema}
          onChange={(evt) => onChange(evt.formData)}
          fields={customFields}
          liveValidate={true}
          FieldTemplate={SettingsFieldTemplate}
          children={<></>}
        />
      )}
    </>
  )
}

export default AnatomyEditor
