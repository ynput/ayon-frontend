import React, { useEffect } from 'react'
import * as Styled from './AttribForm.styled'
import AttribFormType from './AttribFormType'

export const getDefaultFromType = (type) => {
  switch (type) {
    case 'string':
      return ''
    case 'number':
      return 0
    case 'boolean':
      return false
    case 'array':
      return []

    default:
      return undefined
  }
}

const AttribForm = ({ form = {}, onChange, fields, isLoading }) => {
  //   we build the attrib form data based on the schema, trying to match the data types
  // we do this in case form.attrib is missing any fields
  // and so that formData is always in the same format (we don't get uncontrolled inputs)
  useEffect(() => {
    if (!isLoading) return

    // build attribs form data
    const attribForm = {}
    for (const key in fields) {
      const field = fields[key]

      let value = form[key]

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

      attribForm[key] = value
    }
    // update form, this will show the form fields
    onChange('attrib', attribForm)
  }, [form, fields, isLoading])

  // flatten form object
  const formFields = []
  for (const key in form) {
    const value = form[key]
    if (typeof value === 'object' && !Array.isArray(value)) {
      // loop through object and create fields
      for (const k in value) {
        formFields.push({ id: `${key}.${k}`, key: k, value: value[k] })
      }
    } else {
      formFields.push({ id: key, key, value })
    }
  }

  return (
    <Styled.FormContainer>
      {formFields.map(({ key, id, value }) => {
        const { title = key, type = typeof value, format, enumLabels } = fields[key] || {}
        return (
          <Styled.Row key={id}>
            <label>{title}</label>
            <Styled.Field>
              <AttribFormType
                id={id}
                type={type}
                format={format}
                value={value}
                onChange={onChange}
                enumLabels={enumLabels}
              />
            </Styled.Field>
          </Styled.Row>
        )
      })}
    </Styled.FormContainer>
  )
}

export default AttribForm
