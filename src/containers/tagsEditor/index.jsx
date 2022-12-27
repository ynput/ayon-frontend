import React from 'react'
import { useDispatch } from 'react-redux'
import { setDialog } from '/src/features/context'
import TagsEditorDialog from './dialog'
import { setReload } from '../../features/context'
import { useGetTagsByTypeQuery, useUpdateTagsByTypeMutation } from '../../services/ayon'

export const TagsEditorContainer = ({ ids, type, projectName, projectTags }) => {
  // get redux context state
  const dispatch = useDispatch()

  // tags is an object of entity ids as keys  {entityidexample: {tags: ['tag1'], name: 'shot1', id: entityidexample}, }
  const { data: tags, isLoading, isError } = useGetTagsByTypeQuery({ projectName, type, ids })
  console.log(tags)
  // update tags hook
  const [updateTags] = useUpdateTagsByTypeMutation()

  const handleSuccess = async (newTags) => {
    console.log({ newTags })

    // create operations array of all entities
    const operations = Object.keys(tags).map((id) => ({
      type: 'update',
      entityType: type,
      entityId: id,
      data: {
        tags: newTags,
      },
    }))

    console.log({ operations })

    try {
      const payload = updateTags({ projectName, operations }).unwrap()

      console.log('fulfilled', payload)

      // on success updating tags dispatch reload of data
      dispatch(setReload({ type: type, reload: true }))
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
