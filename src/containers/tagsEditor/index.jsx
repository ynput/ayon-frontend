import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { setDialog } from '/src/features/context'
import TagsEditorDialog from './dialog'
import axios from 'axios'
import { toast } from 'react-toastify'
import { setReload } from '../../features/context'

export const TagsEditorContainer = ({
  ids,
  type,
  projectName,
  projectTags,
}) => {
  // get redux context state
  const dispatch = useDispatch()

  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [tags, setTags] = useState([])
  const [names, setNames] = useState([])

  useEffect(() => {
    if (ids && type) {
      // get tags for entity
      setIsLoading(true)

      const getTags = async () => {
        try {
          const { data } = await axios.get(
            `/api/projects/${projectName}/${type}s/${ids[0]}`
          )

          console.log(data)
          setTags(data.tags)
          setNames([data.name])
          console.log(data)
        } catch (error) {
          console.error(error)
          const errMessage = error.response.data.detail || `Error ${error.response.status}`
          toast.error(`Unable to load tags. ${errMessage}`)
          setIsError(true)
        }

        setIsLoading(false)
      }

      getTags()
    }
  }, [ids, setIsLoading])

  const handleSuccess = async (tags) => {
    console.log(tags)
    try {
      await axios.patch(`/api/projects/${projectName}/${type}s/${ids[0]}`, {
        tags,
      })

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
      names={names}
    />
  )
}

export default TagsEditorContainer
