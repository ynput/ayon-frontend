import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@state/store'
import { Button, Dialog } from '@ynput/ayon-react-components'
import DocumentTitle from '@components/DocumentTitle/DocumentTitle'
import useTitle from '@hooks/useTitle'
import VersionsProductsPage from '../VersionsProductsPage'
import ProjectOverviewPage from '../ProjectOverviewPage'
import LoadingPage from '../LoadingPage'
import ProjectAddon from '../ProjectAddon'
import WorkfilesPage from '../WorkfilesPage'
import TasksProgressPage from '../TasksProgressPage'
import ProjectListsPage from '../ProjectListsPage'
import SchedulerPage from '@pages/SchedulerPage/SchedulerPage'

import { selectProject } from '@state/project'
import { useGetProjectAddonsQuery } from '@shared/api'
import { TabPanel, TabView } from 'primereact/tabview'
import AppNavLinks, { NavLinkItem } from '@containers/header/AppNavLinks'
import { SlicerProvider } from '@shared/containers/Slicer'
import { EntityListsProvider } from '@pages/ProjectListsPage/context'
import { Navigate } from 'react-router-dom'
import ProjectPubSub from './ProjectPubSub'
import NewListFromContext from '@pages/ProjectListsPage/components/NewListDialog/NewListFromContext'
import {
  ProjectFoldersContextProvider,
  RemoteAddonProject,
  useGlobalContext,
  useProjectContext,
} from '@shared/context'
import { VersionUploadProvider, UploadVersionDialog } from '@shared/components'
import { productSelected } from '@state/context'
import useGetBundleAddonVersions from '@hooks/useGetBundleAddonVersions'
import ProjectReviewsPage from '@pages/ProjectListsPage/ProjectReviewsPage'
import HelpButton from '@components/HelpButton/HelpButton.tsx'
import ReportsPage from '@pages/ReportsPage/ReportsPage'
import { useLoadRemotePages } from '@/remote/useLoadRemotePages'
import { useProjectDefaultTab } from '@hooks/useProjectDefaultTab'
import BrowserPage from '@pages/BrowserPage'
import GuestUserPageLocked from '@components/GuestUserPageLocked'
import { ProjectContextProvider } from '@shared/context'
import { WithViews } from '@/hoc/WithViews'
import { ProjectPageRemote } from './ProjectPageRemote'

const BROWSER_FLAG = 'enable-legacy-version-browser'

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

const ProjectPageInner = () => {
  /**
   * This component is a wrapper for all project pages
   * It parses the url, loads the project data, dispatches the
   * project data to the store, and renders the requested page.
   */
  const { siteInfo } = useGlobalContext()
  const { uiExposureLevel = 0, frontendFlags = [] } = siteInfo || {}
  const { projectName, isLoading, error, isUninitialized, refetch } = useProjectContext()
  const isManager = useAppSelector((state) => state.user.data.isManager)
  const isAdmin = useAppSelector((state) => state.user.data.isAdmin)
  const navigate = useNavigate()
  const { module = '', addonName } = useParams()
  const dispatch = useAppDispatch()
  const { trackCurrentTab } = useProjectDefaultTab()
  const [showContextDialog, setShowContextDialog] = useState(false)

  const {
    data: addonsData = [],
    isLoading: addonsLoading,
    isError: addonsIsError,
    refetch: refetchAddons,
    isUninitialized: addonsIsUninitialized,
  } = useGetProjectAddonsQuery({}, { skip: !projectName })

  // find out if and what version of the review addon is installed
  const { isLoading: isLoadingAddons, addonVersions: matchedAddons } = useGetBundleAddonVersions({
    addons: ['review', 'planner', 'reports'],
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

  // get remote project module pages
  const links: NavLinkItem[] = useMemo(
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
        deprecated: true,
        enabled: frontendFlags.includes(BROWSER_FLAG),
      },
      {
        name: 'Products',
        path: `/projects/${projectName}/products`,
        module: 'products',
        viewType: 'versions',
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
        name: 'Reports',
        path: `/projects/${projectName}/reports`,
        module: 'reports',
        viewType: 'reports',
        enabled: !!matchedAddons?.get('reports'), // hide the report tab until the addon is out of development
      },
      {
        name: 'Workfiles',
        path: `/projects/${projectName}/workfiles`,
        module: 'workfiles',
        uriSync: true,
      },
      ...remotePages.map((remote) => ({
        name: remote.name || remote.module,
        module: remote.module,
        path: `/projects/${projectName}/${remote.module}`,
        viewType: remote.viewType,
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

  const tab = !!addonName ? addonsData?.find((item) => item.name === addonName)?.name : module
  const isAddon = !!addonName // Check if we're on an addon page
  useEffect(() => {
    trackCurrentTab(tab, isAddon)
  }, [tab, isAddon, trackCurrentTab])

  //
  // Render page
  //

  if (isLoading || !projectName || addonsLoading || isLoadingModules) {
    return <LoadingPage />
  }

  // error
  if (error) {
    setTimeout(() => {
      navigate('/')
    }, 1500)
    return <div className="page">Project Not Found, Redirecting...</div>
  }

  const getPageByModuleAndAddonData = (module: string, addonName?: string) => {
    let component = <div>Module Not Found</div>,
      viewType = activeLink?.viewType

    const foundAddon = addonsData?.find((item) => item.name === addonName)
    const foundRemotePage = remotePages.find((item) => item.module === module)

    if (module === 'overview') {
      component = <ProjectOverviewPage />
    } else if (module === 'tasks') {
      component = <TasksProgressPage />
    } else if (module === 'browser') {
      if (!frontendFlags.includes(BROWSER_FLAG)) {
        component = <Navigate to={`/projects/${projectName}/overview`} />
      }
      component = <BrowserPage projectName={projectName} />
    } else if (module === 'products') {
      component = <VersionsProductsPage projectName={projectName} />
    } else if (module === 'lists') {
      component = <ProjectListsPage projectName={projectName} entityListTypes={['generic']} />
    } else if (module === 'reviews') {
      component = (
        <ProjectReviewsPage
          projectName={projectName}
          isLoadingAccess={isLoadingAddons}
          hasReviewAddon={!!matchedAddons.has('review')}
        />
      )
    } else if (module === 'workfiles') {
      component = <WorkfilesPage />
    } else if (module === 'scheduler') {
      component = <SchedulerPage />
    } else if (module === 'reports') {
      component = <ReportsPage projectName={projectName} />
    } else if (foundAddon) {
      component = (
        <ProjectAddon
          addonName={addonName}
          addonVersion={foundAddon.version}
          sidebar={foundAddon.settings.sidebar}
          addonTitle={foundAddon.title}
        />
      )
    } else if (foundRemotePage) {
      viewType = foundRemotePage.viewType
      component = (
        // this gets wrapped in ViewsProvider for addons to use views
        <main>
          <ProjectPageRemote
            Component={foundRemotePage.component}
            slicer={foundRemotePage.slicer}
            projectName={projectName}
            key={foundRemotePage.id}
          />
        </main>
      )
    } else {
      // Fallback to versions page if no addon matches addonName
      component = <Navigate to={`/projects/${projectName}/overview`} />
    }

    return { component, viewType }
  }

  const page = getPageByModuleAndAddonData(module, addonName)

  const handleNewVersionUploaded = (productId: string, versionId: string) => {
    // focus the new version in the versions
    dispatch(productSelected({ products: [productId], versions: [versionId] }))
  }

  if (uiExposureLevel >= 500) {
    return <GuestUserPageLocked />
  }

  return (
    <ProjectContextProvider projectName={projectName}>
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
      <AppNavLinks links={links} currentModule={module} projectName={projectName} />
      <VersionUploadProvider
        projectName={projectName}
        dispatch={dispatch}
        onVersionCreated={handleNewVersionUploaded}
      >
        <EntityListsProvider {...{ projectName, entityTypes: ['folder', 'task', 'version'] }}>
          <SlicerProvider>
            <WithViews viewType={page.viewType} projectName={projectName}>
              {page.component}
            </WithViews>
          </SlicerProvider>
          <NewListFromContext />
        </EntityListsProvider>
        <UploadVersionDialog />
      </VersionUploadProvider>
      <ProjectPubSub projectName={projectName} onReload={loadProjectData} />
    </ProjectContextProvider>
  )
}

const ProjectPage = () => {
  const { projectName } = useParams()

  // umm... projectName is required
  if (!projectName) return <Navigate to="/" />

  return (
    <ProjectContextProvider projectName={projectName}>
      <ProjectFoldersContextProvider projectName={projectName}>
        <ProjectPageInner />
      </ProjectFoldersContextProvider>
    </ProjectContextProvider>
  )
}

export default ProjectPage
