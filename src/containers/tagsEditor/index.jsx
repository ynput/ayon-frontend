import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { setDialog } from '/src/features/context'
import TagsEditorDialog from './dialog'
import axios from 'axios'
import { toast } from 'react-toastify'
import { setReload } from '../../features/context'
import { useGetTagsByTypeGraphqlQuery } from '../../services/ayon'

const buildTagsQuery = (type) => {
  const TAGS_QUERY = `
    query Tags($projectName: String!, $ids: [String!]!) {
        project(name: $projectName) {
          ${type}s(ids: $ids) {
                edges {
                    node {
                        id
                        name
                        tags
                    }
                }
            }
        }
    }

`

  return TAGS_QUERY
}

export const TagsEditorContainer = ({ ids, type, projectName, projectTags }) => {
  // get redux context state
  const dispatch = useDispatch()

  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  // tags is an object of entity ids as keys  {entityidexample: {tags: ['tag1'], name: 'shot1', id: entityidexample}, }
  const [tags, setTags] = useState({})
  // EXAMPLE USING GRAPHQL POST REQUEST
  const { data, error } = useGetTagsByTypeGraphqlQuery({ projectName, type, ids })
  console.log(data, error)

  useEffect(() => {
    if (ids && type) {
      // get tags for entity
      setIsLoading(true)

      const getTags = async () => {
        try {
          const { data } = await axios.post('/graphql', {
            query: buildTagsQuery(type),
            variables: { projectName, ids },
          })

          if (data.errors) throw data.errors[0].message

          let tagsData = data.data.project[type + 's'].edges

          if (tagsData) {
            // format data as an object with the ids as keys
            tagsData = tagsData.reduce((acc, cur) => ({ ...acc, [cur.node.id]: cur.node }), {})
          } else throw 'No edges found on data'

          console.log(tagsData)

          setTags(tagsData)
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
