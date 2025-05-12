import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@state/store'
import { Button, Dialog } from '@ynput/ayon-react-components'

import BrowserPage from '../BrowserPage'
import ProjectOverviewPage from '../ProjectOverviewPage'
import LoadingPage from '../LoadingPage'
import ProjectAddon from '../ProjectAddon'
import WorkfilesPage from '../WorkfilesPage'
import TasksProgressPage from '../TasksProgressPage'
import ProjectListsPage from '../ProjectListsPage'

import { selectProject } from '@state/project'
import { useGetProjectQuery } from '@queries/project/enhancedProject'
import { useGetProjectAddonsQuery } from '@shared/api'
import { TabPanel, TabView } from 'primereact/tabview'
import AppNavLinks from '@containers/header/AppNavLinks'
import { SlicerProvider } from '@context/SlicerContext'
import { EntityListsProvider } from '@pages/ProjectListsPage/context/EntityListsContext'
import useLoadRemoteProjectPages from '../../remote/useLoadRemotePages'
import { Navigate } from 'react-router-dom'
import ProjectPubSub from './ProjectPubSub'

const ProjectContextInfo = () => {
  /**
   * Show a project context in a dialog
   * this is for development only
   */
  const context = useAppSelector((state) => state.context)
  const project = useAppSelector((state) => state.project)
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
  const { projectName, module = '', addonName } = useParams()
  const dispatch = useAppDispatch()
  const [showContextDialog, setShowContextDialog] = useState(false)
  const { isLoading, isError, isUninitialized, refetch } = useGetProjectQuery(
    { projectName: projectName || '' },
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

  type ModuleData = { name: string; module: string }
  // permanent addon pages that show a fallback when not loaded
  // const permanentAddons: Fallbacks<ModuleData> = new Map([['review', ReviewAddonSpec]])

  const { remotePages, isLoading: isLoadingModules } = useLoadRemoteProjectPages<ModuleData>({
    // fallbacks: permanentAddons,
    moduleKey: 'Project',
    skip: !projectName || !addonsData || addonsLoading || isLoading,
  })

  // get remote project module pages

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
      ...remotePages.map((remote) => ({
        name: remote.data.name,
        module: remote.data.module,
        path: `/projects/${projectName}/${remote.data.module}`,
      })),
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
    [addonsData, projectName, remotePages],
  )

  //
  // Render page
  //

  if (isLoading || !projectName || addonsLoading || isLoadingModules) {
    return <LoadingPage />
  }

  // error
  if (isError) {
    setTimeout(() => {
      navigate('/manageProjects/dashboard')
    }, 1500)
    return <div className="page">Project Not Found, Redirecting...</div>
  }

  const getPageByModuleAndAddonData = (module: string, addonName?: string) => {
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

    const foundAddon = addonsData?.find((item) => item.name === addonName)
    if (foundAddon) {
      return (
        <ProjectAddon
          addonName={addonName}
          addonVersion={foundAddon.version}
          sidebar={foundAddon.settings.sidebar}
        />
      )
    }

    const foundRemotePage = remotePages.find((item) => item.data.module === module)
    if (foundRemotePage) {
      const RemotePage = foundRemotePage.component
      const props = foundRemotePage.isFallback
        ? {}
        : {
            projectName,
          }
      return <RemotePage {...props} />
    }

    // Fallback to browser page if no addon matches addonName
    return <Navigate to={`/projects/${projectName}/overview`} />
  }

  const child = getPageByModuleAndAddonData(module, addonName)

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
      {/* @ts-expect-error - AppNavLinks is jsx */}
      <AppNavLinks links={links} />
      <EntityListsProvider {...{ projectName, entityTypes: ['folder', 'task', 'version'] }}>
        <SlicerProvider>{child}</SlicerProvider>
      </EntityListsProvider>
      <SlicerProvider>{child}</SlicerProvider>
      <ProjectPubSub projectName={projectName} onReload={loadProjectData} />
    </>
  )
}

export default ProjectPage
