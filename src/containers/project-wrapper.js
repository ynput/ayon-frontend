import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useFetch } from 'use-http'
import { useDispatch } from 'react-redux'

import LoadingPage from '../pages/loading'
import ErrorPage from '../pages/error'


const ProjectWrapper = ({children}) => {
    /*
    ProjectWrapper encapsulates the project-specific logic for project-specific pages.

    Basically, it's a wrapper around the children of the page, which parses
    the project name from the URL and stores project information in the Redux store.
    */

    const { projectName } = useParams()
    const dispatch = useDispatch()
    const projectDataRequest = useFetch(`/api/projects/${projectName}`, [])
    const [errorMessage, setErrorMessage] = useState("not loaded")
    const [statusCode, setStatusCode] = useState(0)

    useEffect(() => {
        dispatch({type: 'SELECT_PROJECT', name: projectName})
    }, [dispatch, projectName])


    useEffect(() => {
        setStatusCode(projectDataRequest.response.status)

        if (projectDataRequest.response.status >= 400){
            if (projectDataRequest.response.status === 422)
                setErrorMessage("Data validation error")
            else if (projectDataRequest.data)
                setErrorMessage(projectDataRequest.data.detail)
        }

        else if (projectDataRequest.response.status === 200){
            dispatch({type: 'SET_PROJECT_DATA', data: projectDataRequest.data})
            setErrorMessage(null)
        }

    }, [projectDataRequest.data, projectDataRequest.response.status, dispatch])

    if (projectDataRequest.loading)
        return <LoadingPage/>


    if (errorMessage){
        if (errorMessage === "not loaded")
            return <LoadingPage/>
        return <ErrorPage message={errorMessage} code={statusCode} />
    }

    return children

}    

export default ProjectWrapper