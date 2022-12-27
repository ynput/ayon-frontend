import React from 'react'
import { useDispatch } from 'react-redux'
import { setDialog } from '/src/features/context'
import TagsEditorDialog from './dialog'
import axios from 'axios'
import { toast } from 'react-toastify'
import { setReload } from '../../features/context'
import { useGetTagsByTypeQuery } from '../../services/ayon'

export const TagsEditorContainer = ({ ids, type, projectName, projectTags }) => {
  // get redux context state
  const dispatch = useDispatch()

  // tags is an object of entity ids as keys  {entityidexample: {tags: ['tag1'], name: 'shot1', id: entityidexample}, }
  const { data: tags, isLoading, isError } = useGetTagsByTypeQuery({ projectName, type, ids })
  console.log(tags)

  const handleSuccess = async (newTags) => {
    console.log(newTags)

    try {
      // create operations array of all entities
      const operations = Object.keys(tags).map((id) => ({
        type: 'update',
        entityType: type,
        entityId: id,
        data: {
          tags: newTags,
        },
      }))

      console.log(operations)

      // use operations end point to update all at once
      await axios.post(`/api/projects/${projectName}/operations`, { operations })

      // on success updating tags dispatch reload of data
      dispatch(setReload({ type: type, reload: true }))

      // dispatch callback function to reload data
    } catch (error) {
      console.error(error)
      const errMessage = error.response.data.detail || `Error ${error.response.status}`
      toast.error(`Unable to update tags. ${errMessage}`)
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
