import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useDispatch } from 'react-redux'
import axios from 'axios'

import LoadingPage from '../pages/loading'
import ErrorPage from '../pages/error'

const ProjectWrapper = ({ children }) => {
  /*
    ProjectWrapper encapsulates the project-specific logic for project-specific pages.

    Basically, it's a wrapper around the children of the page, which parses
    the project name from the URL and stores project information in the Redux store.
    */

  const { projectName } = useParams()
  const dispatch = useDispatch()
  const [errorMessage, setErrorMessage] = useState('not loaded')
  const [statusCode, setStatusCode] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    axios
      .get(`/api/projects/${projectName}`)
      .then((response) => {
        dispatch({
          type: 'SET_PROJECT_DATA',
          data: response.data,
        })
        setErrorMessage(null)
      })
      .catch((err) => {
        setStatusCode(err.response.status)
        if (err.response.status === 422)
          setErrorMessage('Data validation error')
        else setErrorMessage(err.response.data.detail || 'Connection error')
      })
      .finally(() => {
        setLoading(false)
      })

    dispatch({ type: 'SELECT_PROJECT', name: projectName })
  }, [dispatch, projectName])

  if (loading) return <LoadingPage />

  if (errorMessage) {
    if (errorMessage === 'not loaded') return <LoadingPage />
    return <ErrorPage message={errorMessage} code={statusCode} />
  }

  return children
}

export default ProjectWrapper
