import React, { useState } from 'react'
import { useGetProjectQuery } from '/src/services/project/getProject'
import DashboardPanelWrapper from '../DashboardPanelWrapper'
import Thumbnail from '/src/containers/thumbnail'
import AttributeTable from '/src/containers/attributeTable'
import { format } from 'date-fns'
import { Button, SaveButton } from '@ynput/ayon-react-components'
import * as Styled from './ProjectDetails.styled'
import AttribForm from '/src/components/AttribForm/AttribForm'

const ProjectDetails = ({ projectName }) => {
  const { data = {}, isFetching } = useGetProjectQuery({ projectName })

  const [editing, setEditing] = useState(false)

  // for updating the project
  const [attribForm, setAttribForm] = useState({})

  const { attrib = {}, active } = data

  const attribArray = []
  for (const key in attrib) {
    let value = attrib[key]

    // if key has "Date" in it, convert to date
    if (key.includes('Date')) {
      value = format(new Date(value), 'dd/MM/yyyy')
    }

    attribArray.push({
      name: key,
      value,
    })
  }

  const handleAttribChange = (newForm) => {
    setAttribForm((prev) => ({ ...prev, ...newForm }))
  }

  // TODO: projects don't currently have a thumbnail

  return (
    <DashboardPanelWrapper
      title={!isFetching ? projectName : ' '}
      header={
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
              <SaveButton label="Save" />
            </>
          )}
        </Styled.Header>
      }
      stylePanel={{ height: 'calc(100% - 8px)', flex: 1, overflow: 'hidden' }}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      <Styled.Thumbnail>
        <Thumbnail projectName={projectName} isLoading={isFetching} shimmer />

        <Styled.Active $isLoading={isFetching} $isActive={active}>
          {active ? 'active' : ' inactive'}
        </Styled.Active>
      </Styled.Thumbnail>
      {editing ? (
        <AttribForm
          initData={!isFetching && data}
          form={attribForm}
          onChange={handleAttribChange}
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
