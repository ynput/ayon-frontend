import React, { useEffect } from 'react'
import { isEmpty } from 'lodash'
import * as Styled from './AttribForm.styled'
import AttribFormType from './AttribFormType'

const AttribForm = ({
  initData = {},
  onChange,
  form,
  fields,
  initActive,
  activeForm,
  onActiveChange,
}) => {
  //   we build the form data based on the schema, trying to match the data types
  // we do this incase initData is missing any fields
  // and so that formData is always in the same format (we don't get uncontrolled inputs)
  useEffect(() => {
    if (!initData || !fields) return

    // set active form
    onActiveChange(initActive)

    // build form data
    const formData = {}
    for (const key in fields) {
      const field = fields[key]

      let value = initData[key]

      //   check if we need to use the default value
      switch (field.type) {
        case 'string':
          value = value ?? field.default ?? ''
          break
        case 'number':
          value = value ?? field.default ?? 0
          break
        case 'boolean':
          value = value ?? field.default ?? false
          break
        case 'array':
          value = value ?? field.default ?? []
          break
        default:
          value = value ?? field.default ?? undefined
          break
      }

      formData[key] = value
    }
    // update form, this will show the form fields
    onChange(formData)
  }, [initData, fields, initActive])

  //   return loading state
  if (!initData || !fields || isEmpty(form)) return null

  const handleChange = (value) => {
    onChange({ ...form, ...value })
  }

  return (
    <Styled.FormContainer>
      <Styled.Row>
        <label>Status</label>
        <Styled.Field>
          <AttribFormType
            id={'active'}
            type={'boolean'}
            value={activeForm}
            onChange={() => onActiveChange(!activeForm)}
          />
        </Styled.Field>
      </Styled.Row>
      {Object.entries(fields).map(
        ([key, { title, type, format, enumLabels }]) =>
          form[key] !== undefined && (
            <Styled.Row key={key}>
              <label>{title}</label>
              <Styled.Field>
                <AttribFormType
                  id={key}
                  type={type}
                  format={format}
                  value={form[key]}
                  onChange={handleChange}
                  enumLabels={enumLabels}
                />
              </Styled.Field>
            </Styled.Row>
          ),
      )}
    </Styled.FormContainer>
  )
}

export default AttribForm
