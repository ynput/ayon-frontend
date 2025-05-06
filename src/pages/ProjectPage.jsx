import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Dialog } from '@ynput/ayon-react-components'

import ProjectOverviewPage from './ProjectOverviewPage'
import TasksProgressPage from './TasksProgressPage'
import BrowserPage from './BrowserPage'
import ProjectListsPage from './ProjectListsPage'
import LoadingPage from './LoadingPage'
import ProjectAddon from './ProjectAddon'
import WorkfilesPage from './WorkfilesPage'

import usePubSub from '@hooks/usePubSub'
import { selectProject } from '@state/project'
import { useGetProjectQuery } from '@queries/project/enhancedProject'
import { useGetProjectAddonsQuery } from '@shared/api'
import { TabPanel, TabView } from 'primereact/tabview'
import AppNavLinks from '@containers/header/AppNavLinks'
import { SlicerProvider } from '@context/SlicerContext'
import { EntityListsProvider } from './ProjectListsPage/context/EntityListsContext'
import { listEntityTypes } from './ProjectListsPage/components/NewListDialog/NewListDialog'

const ProjectContextInfo = () => {
  /**
   * Show a project context in a dialog
   * this is for development only
   */
  const context = useSelector((state) => state.context)
  const project = useSelector((state) => state.project)
  return (
    <TabView panelContainerStyle={{ justifyContent: 'flex-start' }}>
      <TabPanel header="context" style={{ overflow: 'hidden' }}>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify({ context }, null, 2)}</pre>
      </TabPanel>
      <TabPanel header="project" style={{ overflow: 'hidden' }}>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify({ project }, null, 2)}</pre>
      </TabPanel>
    </TabView>
  )
}

const ProjectPage = () => {
  /**
   * This component is a wrapper for all project pages
   * It parses the url, loads the project data, dispatches the
   * project data to the store, and renders the requested page.
   */

  const navigate = useNavigate()
  const { projectName, module, addonName } = useParams()
  const dispatch = useDispatch()
  const [showContextDialog, setShowContextDialog] = useState(false)
  const { isLoading, isError, isUninitialized, refetch } = useGetProjectQuery(
    { projectName },
    { skip: !projectName },
  )

  const {
    data: addonsData = [],
    isLoading: addonsLoading,
    isError: addonsIsError,
    refetch: refetchAddons,
    isUninitialized: addonsIsUninitialized,
  } = useGetProjectAddonsQuery({}, { skip: !projectName })

  useEffect(() => {
    if (!addonsLoading && !addonsIsError && addonsData) {
      dispatch(selectProject(projectName))
    } else {
      // redirect to project manager
    }
  }, [addonsLoading, addonsIsError, addonsData, projectName, dispatch])

  const loadProjectData = () => {
    if (!isUninitialized && !addonsIsUninitialized && !isLoading && !addonsLoading) {
      refetch()
      refetchAddons()
    }
  }

  const handlePubSub = async (topic, message) => {
    if (topic === 'client.connected') {
      console.log('ProjectPage: client.connected. Reloading project data')
      loadProjectData()
    } else if (topic === 'entity.project.changed' && message.project === projectName) {
      loadProjectData()
    } else {
      console.log('ProjectPage: Unhandled pubsub message', topic, message)
    }
  }

  usePubSub('client.connected', handlePubSub)
  usePubSub('entity.project', handlePubSub)

  const links = useMemo(
    () => [
      {
        name: 'Overview',
        path: `/projects/${projectName}/overview`,
        module: 'overview',
        uriSync: true,
      },
      {
        name: 'Task progress',
        path: `/projects/${projectName}/tasks`,
        module: 'tasks',
        uriSync: true,
      },
      {
        name: 'Browser',
        path: `/projects/${projectName}/browser`,
        module: 'browser',
        uriSync: true,
      },
      {
        name: 'Lists',
        path: `/projects/${projectName}/lists`,
        module: 'lists',
        uriSync: true,
      },
      {
        name: 'Workfiles',
        path: `/projects/${projectName}/workfiles`,
        module: 'workfiles',
        uriSync: true,
      },
      ...addonsData.map((addon) => ({
        name: addon.title,
        path: `/projects/${projectName}/addon/${addon.name}`,
        module: addon.name,
      })),
      { node: 'spacer' },
      {
        node: (
          <Button
            icon="more_horiz"
            onClick={() => {
              setShowContextDialog(true)
            }}
            variant="text"
          />
        ),
      },
    ],
    [addonsData, projectName],
  )

  //
  // Render page
  //

  if (isLoading || !projectName || addonsLoading) {
    return <LoadingPage />
  }

  // error
  if (isError) {
    setTimeout(() => {
      navigate('/manageProjects/dashboard')
    }, 1500)
    return <div className="page">Project Not Found, Redirecting...</div>
  }

  const getPageByModuleAndAddonData = (module, addonName, addonsData) => {
    if (module === 'overview') {
      return <ProjectOverviewPage />
    }
    if (module === 'tasks') {
      return <TasksProgressPage />
    }
    if (module === 'browser') {
      return <BrowserPage />
    }
    if (module === 'lists') {
      return <ProjectListsPage />
    }
    if (module === 'workfiles') {
      return <WorkfilesPage />
    }

    if (!addonName) {
      return <ProjectOverviewPage />
    }

    const filteredAddons = addonsData.filter((item) => item.name === addonName)
    if (filteredAddons.length) {
      return (
        <ProjectAddon
          addonName={addonName}
          addonVersion={filteredAddons[0].version}
          sidebar={filteredAddons[0].settings.sidebar}
        />
      )
    }

    // Fallback to browser page if no addon matches addonName
    return <BrowserPage />
  }

  const child = getPageByModuleAndAddonData(module, addonName, addonsData)

  return (
    <>
      <Dialog
        header="Project Context"
        isOpen={showContextDialog}
        onClose={() => setShowContextDialog(false)}
        size="lg"
        style={{ overflow: 'hidden', width: 800 }}
      >
        {showContextDialog && <ProjectContextInfo />}
      </Dialog>
      <AppNavLinks links={links} />
      <EntityListsProvider {...{ projectName, entityTypes: listEntityTypes }}>
        <SlicerProvider>{child}</SlicerProvider>
      </EntityListsProvider>
    </>
  )
}

export default ProjectPage
