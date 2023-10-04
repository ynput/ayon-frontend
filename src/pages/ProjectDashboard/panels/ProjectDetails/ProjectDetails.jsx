import React, { useState } from 'react'
import { useGetProjectQuery } from '/src/services/project/getProject'
import DashboardPanelWrapper from '../DashboardPanelWrapper'
import Thumbnail from '/src/containers/thumbnail'
import AttributeTable from '/src/containers/attributeTable'
import { format } from 'date-fns'
import { Button, SaveButton, Toolbar } from '@ynput/ayon-react-components'
import * as Styled from './ProjectDetails.styled'
import AttribForm from '/src/components/AttribForm/AttribForm'
import { useGetAnatomySchemaQuery } from '/src/services/anatomy/getAnatomy'
import { isEmpty, isEqual } from 'lodash'
import { useSelector } from 'react-redux'
import { useUpdateProjectMutation } from '/src/services/project/updateProject'
import { toast } from 'react-toastify'

const ProjectDetails = ({ projectName }) => {
  const isUser = useSelector((state) => state.user.data.isUser)

  // GET DATA
  const { data = {}, isFetching } = useGetProjectQuery({ projectName })
  const { data: schema } = useGetAnatomySchemaQuery()
  const fields = schema?.definitions?.ProjectAttribModel?.properties

  // UPDATE DATA
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation()

  const [editing, setEditing] = useState(false)

  // for updating the project
  const [attribForm, setAttribForm] = useState({})

  const { attrib = {}, active, code } = data

  const attribArray = []
  for (const key in fields) {
    let field = fields[key]
    let value = attrib[key]

    // if key has "Date" in it, convert to date
    if (field?.format === 'date-time' && value) {
      value = format(new Date(value), 'dd/MM/yyyy')
    }

    attribArray.push({
      name: field.title,
      value,
    })
  }

  attribArray.unshift({
    value: (
      <Styled.Active $isLoading={isFetching} $isActive={active}>
        {active ? 'active' : ' inactive'}
      </Styled.Active>
    ),
    name: 'Status',
  })

  const handleAttribChange = (newForm) => {
    setAttribForm((prev) => ({ ...prev, ...newForm }))
  }

  const handleAttribSubmit = async () => {
    try {
      // validate dates
      const data = {}
      for (const key in attribForm) {
        const field = fields[key]
        let value = attribForm[key]
        if (field?.format === 'date-time') {
          if (value) {
            value = new Date(value).toISOString() ?? null
          } else {
            value = null
          }
        }

        data[key] = value
      }

      await updateProject({ projectName, update: { attrib: data } }).unwrap()

      setEditing(false)
      toast.success('Project updated')
    } catch (error) {
      console.error(error)
      const message = error?.data?.detail
      toast.error('Failed to update project: ' + message)
    }
  }

  const hasChanges = !isEmpty(attrib) && !isEmpty(attribForm) && !isEqual(attrib, attribForm)

  return (
    <DashboardPanelWrapper
      title={
        !isFetching && (
          <Toolbar style={{ gap: 8 }}>
            <h1>{projectName}</h1>
            <Styled.Code>{code}</Styled.Code>
          </Toolbar>
        )
      }
      header={
        !isUser && (
          <Styled.Header>
            {!editing ? (
              <Button label="Edit" icon="edit" onClick={() => setEditing(true)} />
            ) : (
              <>
                <Button
                  label="Cancel"
                  icon="close"
                  onClick={() => setEditing(false)}
                  className="cancel"
                />
                <SaveButton
                  label="Save"
                  active={hasChanges}
                  saving={isUpdating}
                  onClick={handleAttribSubmit}
                />
              </>
            )}
          </Styled.Header>
        )
      }
      stylePanel={{ height: 'calc(100% - 8px)', flex: 1, overflow: 'hidden' }}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      <Styled.Thumbnail>
        <Thumbnail projectName={projectName} isLoading={isFetching} shimmer />
      </Styled.Thumbnail>
      {editing ? (
        <AttribForm
          initData={!isFetching && attrib}
          form={attribForm}
          onChange={handleAttribChange}
          fields={fields}
        />
      ) : (
        <AttributeTable
          projectAttrib={attribArray}
          style={{
            overflow: 'auto',
          }}
          isLoading={isFetching}
        />
      )}
    </DashboardPanelWrapper>
  )
}

export default ProjectDetails
