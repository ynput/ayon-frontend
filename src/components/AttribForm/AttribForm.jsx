import React, { useEffect } from 'react'
import { useGetAnatomySchemaQuery } from '/src/services/anatomy/getAnatomy'
import { isEmpty } from 'lodash'
import * as Styled from './AttribForm.styled'
import AttribFormType from './AttribFormType'
import Typography from '/src/theme/typography.module.css'

const AttribForm = ({ initData = {}, onChange, form }) => {
  const { data: schema } = useGetAnatomySchemaQuery()
  const fields = schema?.definitions?.ProjectAttribModel?.properties

  //   we build the form data based on the schema, trying to match the data types
  // we do this incase initData is missing any fields
  // and so that formData is always in the same format (we don't get uncontrolled inputs)
  useEffect(() => {
    if (!initData || !fields) return
    console.log(fields)

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
  }, [initData, fields])

  //   return loading state
  if (!initData || !fields || isEmpty(form)) return null

  const handleChange = (value) => {
    onChange({ ...form, ...value })
  }

  return (
    <Styled.FormContainer>
      {Object.entries(fields).map(
        ([key, { title, type, format, enumLabels }]) =>
          form[key] !== undefined && (
            <Styled.Row key={key} className={Typography.bodyMedium}>
              <label>{title}</label>
              <AttribFormType
                id={key}
                type={format === 'date-time' ? 'date' : type}
                value={form[key]}
                onChange={handleChange}
                enumLabels={enumLabels}
              />
            </Styled.Row>
          ),
      )}
    </Styled.FormContainer>
  )
}

export default AttribForm
