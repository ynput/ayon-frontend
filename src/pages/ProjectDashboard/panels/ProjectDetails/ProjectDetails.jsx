import React, { useEffect, useState } from 'react'
import { useUpdateProjectMutation } from '@shared/api'
import { useGetProjectQuery } from '@queries/project/enhancedProject'
import { getProjectDisplayName } from '@shared/util'
import DashboardPanelWrapper from '../DashboardPanelWrapper'
import AttributeTable from '@containers/attributeTable'
import { format } from 'date-fns'
import { Button, SaveButton, Toolbar } from '@ynput/ayon-react-components'
import * as Styled from './ProjectDetails.styled'
import AttribForm, { getDefaultFromType } from '@components/AttribForm/AttribForm'
import { useGetAnatomySchemaQuery } from '@queries/anatomy/getAnatomy'
import { isEmpty, isEqual } from 'lodash'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import clsx from 'clsx'
import ProjectThumbnailUploader from '../../../ProjectsPage/components/ProjectThumbnailUploader'
import { Thumbnail } from '@shared/components'

const ProjectDetails = ({ projectName }) => {
  const isUser = useSelector((state) => state.user.data.isUser)

  // GET DATA
  const { data = {}, isFetching, isError } = useGetProjectQuery({ projectName })
  const { data: schema = {} } = useGetAnatomySchemaQuery()
  const fields = schema?.definitions?.ProjectAttribModel?.properties

  // UPDATE DATA
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation()

  const [editing, setEditing] = useState(false)

  // this where we add new fields to the editing form
  const projectFormInit = {
    name: '',
    label: '',
    code: '',
    active: false,
    library: false,
    attrib: {},
  }

  const topLevelFields = {
    name: { type: 'string', title: 'Name', disabled: true },
    label: { type: 'string', title: 'Label' },
    code: { type: 'string', title: 'Code' },
    active: { type: 'boolean', title: 'Active' },
    library: { type: 'boolean', title: 'Library' },
  }

  // This is the start, used to compare changes
  const [initData, setInitData] = useState(projectFormInit)
  // form for project data
  const [projectForm, setProjectForm] = useState(projectFormInit)

  const setInitFormState = (projectData) => {
    const updatedProjectForm = { ...projectFormInit }
    for (const key in projectFormInit) {
      if (key === 'attrib') {
        updatedProjectForm[key] = { ...projectData[key] }
      } else {
        updatedProjectForm[key] = projectData[key] ?? projectFormInit[key]
      }
    }
    // name is immutable — always source from projectName prop
    updatedProjectForm.name = projectName

    // add any fields that have not been added to the form
    for (const key in fields) {
      if (updatedProjectForm.attrib[key] === undefined) {
        const field = fields[key]
        // add missing field
        updatedProjectForm.attrib[key] = getDefaultFromType(field.type)
      }
    }

    setProjectForm(updatedProjectForm)
    // update init data to compare changes
    setInitData(updatedProjectForm)
  }

  // when data has been loaded, update the form
  // we add projectFormInit fields to the form along with attrib fields
  // inside AttribForm we validate attrib fields and any missing fields from schema
  useEffect(() => {
    if (!isFetching && !isEmpty(data)) {
      // update project form with only the fields we need from the projectForm init state
      setInitFormState(data)
    }
  }, [data, isFetching, fields])

  const { attrib = {}, active, code, library, label } = data

  // Every thing below creates the attribute table
  // this is where we add new fields to the attribute table
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
    name: 'Library',
    value: !!library,
  })

  // project code
  attribArray.unshift({
    name: 'Code',
    value: code,
  })

  // editable label
  attribArray.unshift({
    name: 'Label',
    value: label || '',
  })

  // immutable name
  attribArray.unshift({
    name: 'Name',
    value: projectName,
  })

  // Active status
  attribArray.unshift({
    value: (
      <Styled.Active className={clsx({ loading: isFetching, active })}>
        {active ? 'active' : ' inactive'}
      </Styled.Active>
    ),
    name: 'Status',
  })

  // HANDLERS

  const handleProjectChange = (field, value) => {
    const newProjectForm = { ...projectForm, attrib: { ...projectForm.attrib } }

    // check if field has any '.' in it
    const fieldSplit = field.split('.')
    if (fieldSplit.length > 1) {
      // update nested field
      const [key, subKey] = fieldSplit
      newProjectForm[key][subKey] = value
    } else {
      // update normal field
      newProjectForm[field] = value
    }

    setProjectForm(newProjectForm)
  }

  const handleAttribSubmit = async () => {
    try {
      // strip name — immutable, not part of patch model
      const { name: _name, ...patchData } = projectForm
      const data = { ...patchData }
      // validate dates inside attrib
      const attrib = { ...projectForm['attrib'] }
      for (const key in attrib) {
        const field = fields[key]
        let value = attrib[key]
        if (field?.format === 'date-time') {
          if (value) {
            value = new Date(value).toISOString() ?? null
          } else {
            value = null
          }
        }

        attrib[key] = value
      }

      await updateProject({ projectName, projectPatchModel: { ...data, attrib } }).unwrap()

      setEditing(false)
      toast.success('Project updated')
    } catch (error) {
      console.error(error)
      const message = error?.data?.detail
      toast.error('Failed to update project: ' + message)
    }
  }

  const handleCancel = () => {
    // reset the form to the initial state
    setProjectForm(initData)
    // close editing
    setEditing(false)
  }

  const hasChanges = !isEqual(initData, projectForm)

  return (
    <DashboardPanelWrapper
      title={
        !isFetching && (
          <Toolbar style={{ gap: 8 }}>
            <h1>{getProjectDisplayName({ name: projectName, label })}</h1>
            <Styled.Code>{code}</Styled.Code>
          </Toolbar>
        )
      }
      header={
        !isUser && (
          <Styled.Header>
            {!editing ? (
              <Button
                label="Edit"
                icon="edit"
                onClick={() => setEditing(true)}
                disabled={isFetching || isError}
              />
            ) : (
              <>
                <Button label="Cancel" icon="close" onClick={handleCancel} className="cancel" />
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
      stylePanel={{ height: 'calc(100% - 8px)', flex: 1, overflow: 'hidden', minHeight: 'unset' }}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      <ProjectThumbnailUploader
        projectName={projectName}
        projectUpdatedAt={data?.updatedAt}
        isFetching={isFetching}
        disabled={isUser}
        Thumbnail={({ projectName, updatedAt, isFetching, disabled }) => (
          <Styled.ThumbnailWrapper>
            <Thumbnail
              entityType="project"
              projectName={projectName}
              entityUpdatedAt={updatedAt}
              icon="add_photo_alternate"
              shimmer={isFetching}
              disabled={disabled}
              style={{ height: 'auto', aspectRatio: 1.7 }}
            />
          </Styled.ThumbnailWrapper>
        )}
      >
        {editing ? (
          <AttribForm
            form={projectForm}
            onChange={(field, value) => handleProjectChange(field, value)}
            fields={fields}
            topLevelFields={topLevelFields}
            isLoading={isFetching}
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
      </ProjectThumbnailUploader>
    </DashboardPanelWrapper>
  )
}

export default ProjectDetails
