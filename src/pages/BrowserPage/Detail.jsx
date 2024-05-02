import { useDispatch, useSelector } from 'react-redux'
import { Section, Button, AssigneeSelect, TagsSelect, Toolbar } from '@ynput/ayon-react-components'
import { useGetEntitiesDetailsQuery } from '/src/services/entity/getEntity'
import EntityDetailsHeader from '/src/components/Details/EntityDetailsHeader'
import EntityDetailsPanel from '../../components/Details/EntityDetailsPanel'
import StatusSelect from '/src/components/status/statusSelect'
import { useUpdateEntitiesDetailsMutation } from '/src/services/entity/updateEntity'
import { isEqual, union, upperFirst } from 'lodash'
import transformVersionsData from '/src/helpers/transformVersionsData'
import RepresentationList from './RepresentationList'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useGetUsersAssigneeQuery } from '/src/services/user/getUsers'
import { ayonApi } from '/src/services/ayon'
import { toast } from 'react-toastify'
import { patchProductsListWithVersions } from '/src/services/product/getProduct'

const Detail = () => {
  const focused = useSelector((state) => state.context.focused)
  const { type, folders: focusedFolders } = focused

  const ids = focused[type + 's'] || []

  // use dispatch to update redux
  const dispatch = useDispatch()
  const projectName = useSelector((state) => state.project.name)

  const projectTagsOrder = useSelector((state) => state.project.tagsOrder)
  const projectTagsObject = useSelector((state) => state.project.tags)

  // GET ENTITY DATA
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

  const isRep = type === 'representation'
  const repVersionIds = focused.versions || []
  // GET VERSION REPS if type is representation based on rep versionId
  let { data: repsVersionsData = [], isFetching: isFetchingReps } = useGetEntitiesDetailsQuery(
    {
      projectName,
      ids: repVersionIds,
      type: 'version',
    },
    { skip: !isRep || !repVersionIds.length },
  )

  const [showLoading, setShowLoading] = useState(true)

  // showLoading when isFetching and entitiesData ids are different to ids
  useEffect(() => {
    if (isFetching) {
      const oldIds = entitiesData.map(({ node }) => node.id)
      if (!isEqual(oldIds, ids)) {
        setShowLoading(true)
      }
    } else {
      setShowLoading(false)
    }
  }, [isFetching, entitiesData, ids])

  const { data: allUsers = [] } = useGetUsersAssigneeQuery({ names: undefined, projectName })

  const isVersion = type === 'version'
  const showRepsList = ['version', 'representation'].includes(type)
  const versionsDataForReps = isRep && !isFetchingReps ? repsVersionsData : entitiesData

  // if representation, get the representations from the versions
  const representations = useMemo(
    () => (showRepsList && transformVersionsData(versionsDataForReps)) || [],
    [versionsDataForReps, showRepsList],
  )

  // PATCH ENTITY DATA
  const [updateEntity] = useUpdateEntitiesDetailsMutation()

  // first patch the products list if the type is version, and status update
  const handleEntityChange = async (field, value) => {
    // patches = entitiesData but with field and value set for all entities
    const patches = [...entitiesData].map(({ node }) => ({
      ...node,
      [field]: value,
    }))
    let productsPatch
    // if the type is version and the is field is status or version, patch products list
    // because the version status/version is also shown in the product list
    if (isVersion && ['status', 'name'].includes(field)) {
      // update productsList cache with new status
      productsPatch = patchProductsListWithVersions(
        { folderIds: focusedFolders, projectName },
        {
          versions: patches.map((version) => ({
            productId: version.product?.id,
            versionId: version.id,
            versionStatus: value,
          })),
        },
        { dispatch },
      )
    }

    try {
      const payload = await updateEntity({
        projectName,
        type: type,
        ids: ids,
        data: { [field]: value },
        patches,
        disabledInvalidation: isVersion,
      }).unwrap()

      // check the success of the update, otherwise throw error
      if (payload?.success === false)
        throw new Error(payload?.operations?.map((o) => o?.detail).join(', ') || 'Failed to update')

      if (isVersion) {
        // invalidate 'version' query (specific version query)
        // we do this so that when we select this version again, it doesn't use stale version query
        dispatch(ayonApi.util.invalidateTags(ids.map((id) => ({ type: 'version', id }))))
      }
    } catch (error) {
      console.error(error)

      toast.error(error?.message || 'Failed to update')
      // we also need to undo the patch
      productsPatch?.undo()
    }
  }

  // patch in new thumbnail data for both product list and
  const handleVersionThumbnailUpdate = (value) => {
    const { id, thumbnailId, type } = value || {}

    // only update if type is version and id and thumbnailId is set
    if (!id || !thumbnailId) return

    // create a fake updatedAt
    const updatedAt = new Date().toISOString()

    let success1 = false
    let success2 = false

    // patch new updatedAt for getEntitiesDetails
    dispatch(
      ayonApi.util.updateQueryData(
        'getEntitiesDetails',
        { projectName, ids: ids, type },
        (draft) => {
          // find the product in the cache that match the ids
          // and update the updatedAt
          let item = draft.find((p) => p.node.id === id)
          if (item) {
            success2 = true
            item.node.updatedAt = updatedAt
          }
        },
      ),
    )

    const invalidate = () => {
      dispatch(ayonApi.util.invalidateTags([{ type: type, id: id }]))
    }

    if (type !== 'version') {
      if (!success1) {
        // patching failed so lets invalidate the cache
        invalidate()
      }
    }

    // patch in the new updatedAt for version id on getProductList
    dispatch(
      ayonApi.util.updateQueryData(
        'getProductList',
        { projectName, ids: focusedFolders },
        (draft) => {
          // find the product in the cache that match the ids
          // and update the versionUpdatedAt
          let item = draft.find((p) => p.versionId === id)
          if (item) {
            success1 = true
            item.versionUpdatedAt = updatedAt
          }
        },
      ),
    )

    if (!success1 || !success2) {
      // patching failed so lets invalidate the cache
      invalidate()
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
    version: ['author', 'product.productType'],
    product: ['productType', 'latestVersion.name'],
    folder: ['folderType', 'path'],
    task: ['taskType', 'assignees'],
  }

  // components for extra fields
  const fieldComponents = {
    author: {
      title: 'Author',
    },
    productType: {
      title: 'Product Type',
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
          value={values}
          align={'right'}
          onChange={(v) => handleEntityChange('status', v)}
          multipleSelected={values.length}
          maxWidth={'100%'}
          style={{
            paddingLeft: 8,
          }}
        />
      ),
    },
    tags: {
      title: 'Tags',
      value: (values) => (
        <TagsSelect
          value={union(...values)}
          isMultiple={values.some((v) => !isEqual(v, values[0]))}
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
    <Section wrap>
      <Toolbar>
        <span className="section-header">{upperFirst(type)}</span>
      </Toolbar>
      <Section style={{ overflow: 'hidden', borderRadius: 3 }}>
        <EntityDetailsHeader
          values={nodes}
          isLoading={showLoading}
          hideThumbnail
          tools={
            enableEdit &&
            !showLoading && (
              <Link to={enableEdit ? `/projects/${projectName}/editor` : '#'}>
                <Button icon="edit" disabled={!enableEdit} variant="text" data-tooltip={'Edit'} />
              </Link>
            )
          }
        />
        <EntityDetailsPanel
          nodes={nodes}
          extraAttrib={extraAttribFields}
          type={type}
          typeFields={typeFields}
          isError={isError}
          hideNull={isVersion}
          style={{ height: isVersion ? 'unset' : '100%' }}
          isLoading={showLoading}
          onThumbnailUpload={handleVersionThumbnailUpdate}
        />
        {showRepsList && (
          <RepresentationList representations={representations} projectName={projectName} />
        )}
      </Section>
    </Section>
  )
}

export default Detail
