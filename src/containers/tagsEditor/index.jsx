import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setDialog } from '/src/features/context'
import TagsEditorDialog from './dialog'
import axios from 'axios'

export const TagsEditorContainer = () => {
  // get redux context state
  const dispatch = useDispatch()
  const context = useSelector((state) => ({ ...state.context }))
  // check if tags dialog is open
  const isTagsOpen = context.dialog.type === 'tags'

  const entityType = context.dialog.entityType
  const entityId = context.dialog.entityId
  const projectName = context.projectName
  // get all tags for project
  const projectTags = context.project.tags

  //   DUMMY TAGS STATE
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [tags, setTags] = useState([])

  useEffect(() => {
    if (isTagsOpen && entityId) {
      // get tags for entity
      setIsLoading(true)

      const getTags = async () => {
        try {
          const { data } = await axios.get(
            `/api/projects/${projectName}/${entityType}s/${entityId}`
          )

          setTags(data.tags)
        } catch (error) {
          console.error(error)
          const errMessage =
            error.response.data.detail || `Error ${error.response.status}`
          toast.error(`Unable to load tags. ${errMessage}`)
          setIsError(true)
        }

        setIsLoading(false)
      }

      getTags()
    }
  }, [isTagsOpen, entityId, setIsLoading])

  const handleSuccess = (tags) => {
    console.log(tags)
    setTags(tags)
  }

  return (
    <TagsEditorDialog
      visible={isTagsOpen}
      onHide={() => dispatch(setDialog())}
      tags={projectTags}
      value={tags}
      onSuccess={handleSuccess}
      isLoading={isLoading}
      error={isError}
    />
  )
}

export default TagsEditorContainer
