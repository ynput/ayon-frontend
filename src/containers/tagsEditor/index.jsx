import React from 'react'
import { useDispatch } from 'react-redux'
import { setDialog } from '/src/features/context'
import TagsEditorDialog from './dialog'
import { useGetTagsByTypeQuery, useUpdateTagsByTypeMutation } from '../../services/ayon'

export const TagsEditorContainer = ({ ids, type, projectName, projectTags }) => {
  // get redux context state
  const dispatch = useDispatch()

  // tags is an object of entity ids as keys  {entityidexample: {tags: ['tag1'], name: 'shot1', id: entityidexample}, }
  const { data: tags, isLoading, isError } = useGetTagsByTypeQuery({ projectName, type, ids })
  // update tags hook
  const [updateTags] = useUpdateTagsByTypeMutation()

  const handleSuccess = async (newTags) => {
    console.log({ newTags })

    try {
      const payload = await updateTags({ projectName, type, ids, tags: newTags }).unwrap()

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
