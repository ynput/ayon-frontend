import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@state/store'
import { Button, Dialog } from '@ynput/ayon-react-components'
import DocumentTitle from '@components/DocumentTitle/DocumentTitle'
import useTitle from '@hooks/useTitle'
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
import { Navigate } from 'react-router-dom'
import ProjectPubSub from './ProjectPubSub'
import NewListFromContext from '@pages/ProjectListsPage/components/NewListDialog/NewListFromContext'
import { RemoteAddonProject } from '@shared/context'
import { VersionUploadProvider, UploadVersionDialog } from '@shared/components'
import { productSelected } from '@state/context'
import useGetBundleAddonVersions from '@hooks/useGetBundleAddonVersions'
import ProjectReviewsPage from '@pages/ProjectListsPage/ProjectReviewsPage'
import ExternalUserPageLocked from '@components/ExternalUserPageLocked'
import { Views, ViewsProvider, ViewType } from '@shared/containers'
import HelpButton from "@components/HelpButton/HelpButton.tsx"
import ReportPage from '@pages/ReportPage/ReportPage'
import { useLoadRemotePages } from '@/remote/useLoadRemotePages'

type NavLink = {
  name?: string
  path?: string
  module?: string
  viewType?: ViewType
  uriSync?: boolean
  enabled?: boolean
  node?: React.ReactNode
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
  const isExternal = useAppSelector((state) => (state.user.data as any)?.isExternal || false)
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

  // find out if and what version of the review addon is installed
  const { isLoading: isLoadingAddons, addonVersions: matchedAddons } = useGetBundleAddonVersions({
    addons: ['review', 'planner', 'report'],
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

  const { remotePages, isLoading: isLoadingModules } = useLoadRemotePages({
    // fallbacks: permanentAddons,
    moduleKey: 'Project',
    skip: !projectName || !addonsData || addonsLoading || isLoading,
  }) as {
    remotePages: RemoteAddonProject[]
    isLoading: boolean
  }

  console.log('matchedAddons', matchedAddons)

  // get remote project module pages
  const links: NavLink[] = useMemo(
    () => [
      {
        name: 'Overview',
        path: `/projects/${projectName}/overview`,
        module: 'overview',
        viewType: 'overview',
        uriSync: true,
      },
      {
        name: 'Task progress',
        path: `/projects/${projectName}/tasks`,
        module: 'tasks',
        viewType: 'taskProgress',
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
        viewType: 'lists',
      },
      {
        name: 'Review',
        path: `/projects/${projectName}/reviews`,
        module: 'reviews',
        viewType: 'reviews',
      },
      {
        name: 'Scheduler',
        path: `/projects/${projectName}/scheduler`,
        module: 'scheduler',
        enabled: matchedAddons?.get('planner') === '0.1.0-dev', // for dev purposes, remove when planner is released out of beta
      },
      {
        name: 'Report',
        path: `/projects/${projectName}/report`,
        module: 'report',
        viewType: 'report',
      },
      {
        name: 'Workfiles',
        path: `/projects/${projectName}/workfiles`,
        module: 'workfiles',
        uriSync: true,
      },
      ...remotePages
        .map((remote) => ({
          name: remote.name,
          module: remote.module,
          path: `/projects/${projectName}/${remote.module}`,
        })),
      ...addonsData
        .filter((addon) => {
          if (addon.settings.admin && !isAdmin) return false
          if (addon.settings.manager && !isManager) return false
          if (addon.name === 'report') return false
          // Filter out addons that are already handled by Module Federation
          const isHandledByModuleFederation = remotePages.some(remote => 
            remote.module === addon.name || 
            remote.name === addon.title ||
            remote.module === addon.title
          )
          if (isHandledByModuleFederation) return false
          return true
        })
        .map((addon) => ({
          name: addon.title,
          path: `/projects/${projectName}/addon/${addon.name}`,
          module: addon.name,
        })),
      { node: 'spacer' },
      {
        node: <HelpButton module={addonName || module} />,
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
    [addonsData, projectName, remotePages, matchedAddons, module],
  )

  const activeLink = useMemo(() => {
    return links.find((link) => link.module === module) || null
  }, [links, module])

  const title = useTitle(module, links, projectName || 'AYON')

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
    console.log('module', module, 'addonName', addonName);

    // // Handle report module as an addon
    // if (module === 'report') {
    //   addonName = 'report'
    // }

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
    if (module === 'report') {
      return <ReportPage />
    }
    // Check if this module is handled by Module Federation first
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

    // Handle addon-specific routes (iframe approach for non-Module Federation addons)
    const foundAddon = addonsData?.find((item) => item.name === addonName)
    if (foundAddon) {
      return (
        <ProjectAddon
          addonName={addonName}
          addonVersion={foundAddon.version}
          sidebar={foundAddon.settings.sidebar}
          addonTitle={foundAddon.title}
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

  if (isExternal){
    return <ExternalUserPageLocked/>
  }

  return (
    <>
      <DocumentTitle title={title} />
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
      <AppNavLinks links={links} currentModule={module} projectName={projectName} />
      <VersionUploadProvider
        projectName={projectName}
        dispatch={dispatch}
        onVersionCreated={handleNewVersionUploaded}
      >
        <EntityListsProvider {...{ projectName, entityTypes: ['folder', 'task', 'version'] }}>
          <SlicerProvider>
            <ViewsProvider
              viewType={activeLink?.viewType}
              projectName={projectName}
              dispatch={dispatch}
            >
              <Views />
              {child}
            </ViewsProvider>
          </SlicerProvider>
          <NewListFromContext />
        </EntityListsProvider>
        <UploadVersionDialog />
      </VersionUploadProvider>
      <ProjectPubSub projectName={projectName} onReload={loadProjectData} />
    </>
  )
}

export default ProjectPage
