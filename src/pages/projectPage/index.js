import { useState, useEffect } from 'react'
import { useParams, NavLink } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import axios from 'axios'

import { Spacer } from '../../components'

import BrowserPage from '../browser'
import ManagerPage from '../manager'
import SiteSync from '../sitesync'
import LoadingPage from '../loading'

import { selectProject, setProjectData } from '../../features/context'

const ProjectPage = () => {
  const [loading, setLoading] = useState(true)
  const { projectName, module } = useParams()
  const dispatch = useDispatch()

  useEffect(() => {
    return () => {
      // Set project data to null when leaving project page
      dispatch(selectProject(null))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setLoading(true)
    axios
      .get(`/api/projects/${projectName}`)
      .then((response) => {
        dispatch(setProjectData(response.data))
      })
      .finally(() => {
        setLoading(false)
      })

    dispatch(selectProject(projectName))
  }, [dispatch, projectName])

  if (loading) {
    return <LoadingPage />
  }

  let child = null
  if (module === 'manager') child = <ManagerPage />
  else if (module === 'sitesync') child = <SiteSync />
  else child = <BrowserPage />

  return (
    <>
      <nav id="project-nav">
        <NavLink to={`/projects/${projectName}/browser`}>Browser</NavLink>
        <NavLink to={`/projects/${projectName}/manager`}>Manager</NavLink>
        <NavLink to={`/projects/${projectName}/sitesync`}>SiteSync</NavLink>
        <Spacer />
      </nav>
      {child}
    </>
  )
}

export default ProjectPage
