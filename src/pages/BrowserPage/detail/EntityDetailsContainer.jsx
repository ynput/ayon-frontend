import { useSelector } from 'react-redux'
import {
  Section,
  LoaderShade,
  Button,
  AssigneeSelect,
  TagsSelect,
} from '@ynput/ayon-react-components'
import { useGetEntitiesDetailsQuery } from '/src/services/entity/getEntity'
import EntityDetailsHeader from '/src/components/Details/EntityDetailsHeader'
import EntityDetails from '/src/components/Details/EntityDetails'
import StatusSelect from '/src/components/status/statusSelect'
import { useUpdateEntitiesDetailsMutation } from '/src/services/entity/updateEntity'
import { union } from 'lodash'
import transformVersionsData from '/src/helpers/transformVersionsData'
import RepresentationList from '../RepresentationList'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useGetUsersAssigneeQuery } from '/src/services/user/getUsers'

const EntityDetailsContainer = ({ type, ids = [] }) => {
  const projectName = useSelector((state) => state.project.name)

  const projectTagsOrder = useSelector((state) => state.project.tagsOrder)
  const projectTagsObject = useSelector((state) => state.project.tags)

  // GET RTK QUERY
  let {
    data: entitiesData = [],
    isError,
    isFetching,
  } = useGetEntitiesDetailsQuery(
    {
      projectName,
      ids: ids,
      type: type,
    },
    { skip: !ids.length || !type },
  )

  const { data: allUsers = [] } = useGetUsersAssigneeQuery({ names: undefined })

  const isVersion = type === 'version'

  // if representation, get the representations from the versions
  const representations = useMemo(
    () => (!isFetching && !isError && isVersion && transformVersionsData(entitiesData)) || [],
    [entitiesData, isError, isFetching, type],
  )

  // PATCH ENTITY DATA
  const [updateEntity] = useUpdateEntitiesDetailsMutation()

  const handleEntityChange = async (field, value) => {
    // patches = entitiesData but with field and value set for all entities
    const patches = [...entitiesData].map(({ node }) => ({
      ...node,
      [field]: value,
    }))

    try {
      const payload = await updateEntity({
        projectName,
        type: type,
        ids: ids,
        data: { [field]: value },
        patches,
      }).unwrap()

      console.log('fulfilled', payload)
    } catch (error) {
      console.error('rejected', error)
    }
  }

  const nodes = entitiesData.map((entity) => ({
    ...entity?.node,
    attrib: entity?.node?.attrib || {},
    __entityType: type,
    extraAttrib: {},
  }))

  // extra fields on all types
  const extraFields = ['status', 'tags']

  // extra fields for specific types
  const typeFieldNames = {
    version: ['author', 'subset.family'],
    subset: ['family', 'latestVersion.name'],
    folder: ['folderType', 'path'],
    task: ['taskType', 'assignees'],
  }

  // components for extra fields
  const fieldComponents = {
    author: {
      title: 'Author',
    },
    family: {
      title: 'Family',
    },
    latestVersion: {
      title: 'Latest Version',
    },
    folderType: {
      title: 'Folder Type',
    },
    path: {
      title: 'Path',
    },
    taskType: {
      title: 'Task Type',
    },
    status: {
      title: 'Status',
      value: (values) => (
        <StatusSelect
          value={values?.length > 1 ? 'Multiple Statuses' : values[0]}
          align={'right'}
          onChange={(v) => handleEntityChange('status', v)}
          widthExpand={false}
          disabled={values?.length > 1}
        />
      ),
    },
    tags: {
      title: 'Tags',
      value: (values) => (
        <TagsSelect
          value={union(...values)}
          tags={projectTagsObject}
          tagsOrder={projectTagsOrder}
          onChange={(v) => handleEntityChange('tags', v)}
          align="right"
          styleDropdown={{ overflow: 'hidden' }}
          width={200}
        />
      ),
    },
    assignees: {
      title: 'Assignees',
      value: (values) => (
        <AssigneeSelect
          value={values?.length > 1 ? union(...values) : values[0] || []}
          options={allUsers}
          isMultiple={new Set(...values)?.length > 1}
          editor
          align={'right'}
          onChange={(v) => handleEntityChange('assignees', v)}
          disabled={values?.length > 1}
        />
      ),
    },
  }

  const extraAttribFields = []

  const typeFields = extraFields.concat(typeFieldNames[type] || []).flatMap((field) => {
    // if field is a nested field, split it
    const fieldParts = field.split('.')
    const fieldName = fieldParts[fieldParts.length - 1]
    const useString = !fieldComponents[fieldName]?.value

    // extra field to extraAttribFields
    if (useString && fieldComponents[fieldName]) {
      extraAttribFields.push({
        name: fieldName,
        data: { title: fieldComponents[fieldName]?.title },
      })
    }

    if (fieldComponents[fieldName]) {
      // get all values for the field
      const values = entitiesData.map((entity, i) => {
        let value = entity.node[fieldName]

        if (fieldParts.length > 1) {
          value = fieldParts.reduce((acc, part) => acc && acc[part], entity.node)
        }

        if (useString && nodes[i]) {
          // add new field to data for the node
          nodes[i].extraAttrib[fieldName] = value
        }

        return value
      })

      // return early if value isn't set (not custom field)
      if (useString) return []

      // return the title and value
      return {
        title: fieldComponents[fieldParts[0]]?.title,
        value: fieldComponents[fieldParts[0]]?.value(values),
      }
    } else return []
  })

  // show edit tool button if task or folder
  const enableEdit = type === 'task' || type === 'folder'

  return (
    <Section style={{ overflow: 'hidden', borderRadius: 3 }}>
      {isFetching && <LoaderShade />}
      <EntityDetailsHeader
        values={nodes}
        tools={
          <Link to={enableEdit ? `/projects/${projectName}/editor` : '#'}>
            <Button icon="edit" disabled={!enableEdit} />
          </Link>
        }
      />
      <EntityDetails
        nodes={nodes}
        extraAttrib={extraAttribFields}
        type={type}
        typeFields={typeFields}
        isError={isError}
        hideNull={isVersion}
        style={{ height: isVersion ? 'unset' : '100%' }}
      />
      {isVersion && <RepresentationList representations={representations} />}
    </Section>
  )
}

export default EntityDetailsContainer
