import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@state/store'
import { Button, Dialog } from '@ynput/ayon-react-components'

import BrowserPage from '../BrowserPage'
import ProjectOverviewPage from '../ProjectOverviewPage'
import LoadingPage from '../LoadingPage'
import ProjectAddon from '../ProjectAddon'
import WorkfilesPage from '../WorkfilesPage'
import TasksProgressPage from '../TasksProgressPage'
import ProjectListsPage from '../ProjectListsPage'
import SchedulerPage from '@pages/SchedulerPage/SchedulerPage'

import { selectProject } from '@state/project'
import { useGetProjectQuery } from '@queries/project/enhancedProject'
import { useGetProjectAddonsQuery } from '@shared/api'
import { TabPanel, TabView } from 'primereact/tabview'
import AppNavLinks from '@containers/header/AppNavLinks'
import { SlicerProvider } from '@context/SlicerContext'
import { EntityListsProvider } from '@pages/ProjectListsPage/context'
import useLoadRemoteProjectPages from '../../remote/useLoadRemotePages'
import { Navigate } from 'react-router-dom'
import ProjectPubSub from './ProjectPubSub'
import NewListFromContext from '@pages/ProjectListsPage/components/NewListDialog/NewListFromContext'
import { RemoteAddonProject } from '@shared/context'
import { VersionUploadProvider, UploadVersionDialog, useFeedback } from '@shared/components'
import { productSelected } from '@state/context'
import useGetBundleAddonVersions from '@hooks/useGetBundleAddonVersions'
import ProjectReviewsPage from '@pages/ProjectListsPage/ProjectReviewsPage'
import { find } from 'lodash'

type ProjectNavLink = {
  name: string
  path: string
  module: string
  uriSync?: boolean
  articleId?: string
  enabled?: boolean
}

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

  const isManager = useAppSelector((state) => state.user.data.isManager)
  const isAdmin = useAppSelector((state) => state.user.data.isAdmin)
  const navigate = useNavigate()
  const { projectName, module = '', addonName } = useParams()
  const dispatch = useAppDispatch()
  const [showContextDialog, setShowContextDialog] = useState(false)
  const { isLoading, isError, isUninitialized, refetch } = useGetProjectQuery(
    { projectName: projectName || '' },
    { skip: !projectName },
  )
  const { openSupport, loaded } = useFeedback()

  const {
    data: addonsData = [],
    isLoading: addonsLoading,
    isError: addonsIsError,
    refetch: refetchAddons,
    isUninitialized: addonsIsUninitialized,
  } = useGetProjectAddonsQuery({}, { skip: !projectName })

  // find out if and what version of the review addon is installed
  const { isLoading: isLoadingAddons, addonVersions: matchedAddons } = useGetBundleAddonVersions({
    addons: ['review', 'planner'],
  })

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

  // permanent addon pages that show a fallback when not loaded
  // const permanentAddons: Fallbacks<ModuleData> = new Map([['review', ReviewAddon]])

  const { remotePages, isLoading: isLoadingModules } = useLoadRemoteProjectPages({
    // fallbacks: permanentAddons,
    moduleKey: 'Project',
    skip: !projectName || !addonsData || addonsLoading || isLoading,
  }) as {
    remotePages: RemoteAddonProject[]
    isLoading: boolean
  }

  const links: ProjectNavLink[] = useMemo(
    () => [
      {
        name: 'Overview',
        path: `/projects/${projectName}/overview`,
        module: 'overview',
        uriSync: true,
        articleId: '7885519',
      },
      {
        name: 'Task progress',
        path: `/projects/${projectName}/tasks`,
        module: 'tasks',
        uriSync: true,
        articleId: '5526719',
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
        articleId: '7382645',
      },
      {
        name: 'Review',
        path: `/projects/${projectName}/reviews`,
        module: 'reviews',
      },
      {
        name: 'Scheduler',
        path: `/projects/${projectName}/scheduler`,
        module: 'scheduler',
        enabled: matchedAddons?.get('planner') === '0.1.0-dev', // for dev purposes, remove when planner is released out of beta
      },
      {
        name: 'Workfiles',
        path: `/projects/${projectName}/workfiles`,
        module: 'workfiles',
        uriSync: true,
      },
      ...remotePages.map((remote) => ({
        name: remote.name,
        module: remote.module,
        path: `/projects/${projectName}/${remote.module}`,
      })),
      ...addonsData
        .filter((addon) => {
          if (addon.settings.admin && !isAdmin) return false
          if (addon.settings.manager && !isManager) return false
          return true
        })
        .map((addon) => ({
          name: addon.title,
          path: `/projects/${projectName}/addon/${addon.name}`,
          module: addon.name,
        })),
    ],
    [addonsData, projectName, remotePages, matchedAddons],
  )

  const helpButtons = useMemo(
    () => [
      {
        node: (
          <Button
            icon="help"
            onClick={() => {
              if (!loaded) return
              const currentModule = find(links, (l) => l.module === module)

              const supportView = currentModule?.articleId ? 'ShowArticle' : 'NewMessage'
              const supportContent = currentModule?.articleId
                ? currentModule.articleId
                : `Can you help me know more about the Project ${
                    currentModule?.name || module
                  } page?`
              openSupport(supportView, supportContent)
            }}
            variant="text"
          />
        ),
      },
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
    [module, openSupport],
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
      navigate('/')
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
      return <BrowserPage projectName={projectName} />
    }
    if (module === 'lists') {
      return <ProjectListsPage projectName={projectName} entityListTypes={['generic']} />
    }
    if (module === 'reviews') {
      return (
        <ProjectReviewsPage
          projectName={projectName}
          isLoadingAccess={isLoadingAddons}
          hasReviewAddon={!!matchedAddons.has('review')}
        />
      )
    }
    if (module === 'workfiles') {
      return <WorkfilesPage />
    }
    if (module === 'scheduler') {
      return <SchedulerPage />
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

    const foundRemotePage = remotePages.find((item) => item.module === module)
    if (foundRemotePage) {
      const RemotePage = foundRemotePage.component
      return (
        <RemotePage
          router={{
            ...{ useParams, useNavigate, useLocation, useSearchParams },
          }}
          projectName={projectName}
        />
      )
    }

    // Fallback to browser page if no addon matches addonName
    return <Navigate to={`/projects/${projectName}/overview`} />
  }

  const child = getPageByModuleAndAddonData(module, addonName)

  const handleNewVersionUploaded = (productId: string, versionId: string) => {
    // focus the new version in the browser
    dispatch(productSelected({ products: [productId], versions: [versionId] }))
  }

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
      <AppNavLinks links={links} helpButtons={helpButtons} />
      <VersionUploadProvider
        projectName={projectName}
        dispatch={dispatch}
        onVersionCreated={handleNewVersionUploaded}
      >
        <EntityListsProvider {...{ projectName, entityTypes: ['folder', 'task', 'version'] }}>
          <SlicerProvider>{child}</SlicerProvider>
          <NewListFromContext />
        </EntityListsProvider>
        <UploadVersionDialog />
      </VersionUploadProvider>
      <ProjectPubSub projectName={projectName} onReload={loadProjectData} />
    </>
  )
}

export default ProjectPage
