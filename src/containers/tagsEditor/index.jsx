import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setDialog } from '/src/features/context'
import TagsEditorDialog from './dialog'
import { useGetEntitiesDetailsQuery } from '../../services/entity/getEntity'
import { useUpdateEntitiesDetailsMutation } from '../../services/entity/updateEntity'

export const TagsEditorContainer = () => {
  const projectTags = useSelector((state) => state.context.project.tags)
  const projectName = useSelector((state) => state.context.projectName)
  // entity type folder, version, subset, task
  const type = useSelector((state) => state.context.focused.type)
  const dialogType = useSelector((state) => state.context.dialog.type)
  const focused = useSelector((state) => state.context.focused)

  let ids = []
  if (type) {
    ids = focused[`${type}s`]
  }

  // get redux context state
  const dispatch = useDispatch()

  // tags is an object of entity ids as keys  {entityidexample: {tags: ['tag1'], name: 'shot1', id: entityidexample}, }
  const {
    data: entitiesData,
    isLoading,
    isError,
  } = useGetEntitiesDetailsQuery({ projectName, type, ids }, { skip: !type })

  // update tags hook
  const [updateTags] = useUpdateEntitiesDetailsMutation()

  if (dialogType !== 'tags' || !ids?.length) return null

  if (isLoading || isError) return null

  const tags = entitiesData.reduce((acc, cur) => ({ ...acc, [cur.node.id]: cur.node }), {})

  const handleSuccess = async (newTags) => {
    console.log({ newTags })
    const patches = entitiesData.map((entity) => ({ ...entity.node, tags: newTags }))

    try {
      const payload = await updateTags({
        projectName,
        type,
        patches,
        data: { tags: newTags },
      }).unwrap()

      console.log('fulfilled', payload)
    } catch (error) {
      console.error('rejected', error)
    }
  }

  return (
    <TagsEditorDialog
      visible={true}
      onHide={() => dispatch(setDialog())}
      tags={projectTags}
      value={tags}
      onSuccess={handleSuccess}
      isLoading={isLoading}
      isError={isError}
    />
  )
}

export default TagsEditorContainer
