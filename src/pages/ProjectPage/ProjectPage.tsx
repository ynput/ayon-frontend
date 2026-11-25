import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@state/store'
import { openViewer } from '@state/viewer'
import { Button, Dialog, Toolbar } from '@ynput/ayon-react-components'
import DocumentTitle from '@components/DocumentTitle/DocumentTitle'
import useTitle from '@hooks/useTitle'
import VersionsProductsPage from '../VersionsProductsPage'
import ProjectOverviewPage from '../ProjectOverviewPage'
import LoadingPage from '../LoadingPage'
import ProjectAddon from '../ProjectAddon'
import WorkfilesPage from '../WorkfilesPage'
import TasksProgressPage from '../TasksProgressPage'
import ProjectListsPage from '../ProjectListsPage'

import { selectProject, setOpenProject } from '@state/project'
import { getProjectDisplayName } from '@shared/util'
import AppNavLinks, { NavLinkItem } from '@containers/header/AppNavLinks'
import { SlicerProvider } from '@shared/containers/Slicer'
import { usePrefetchViews, useViewsContext, useViewUpdateHelper } from '@shared/containers/Views'
import { EntityListsProvider } from '@pages/ProjectListsPage/context'
import { Navigate } from 'react-router-dom'
import NewListFromContext from '@pages/ProjectListsPage/components/NewListDialog/NewListFromContext'
import {
  EntityUpdatesProvider,
  ProjectFoldersContextProvider,
  useDetailsPanelContext,
  useGlobalContext,
  useProjectContext,
} from '@shared/context'
import { VersionUploadProvider, UploadVersionDialog, JsonViewer } from '@shared/components'
import { productSelected } from '@state/context'
import ProjectReviewsPage from '@pages/ProjectListsPage/ProjectReviewsPage'
import HelpButton from '@components/HelpButton/HelpButton.tsx'
import ProjectReportsPage from '@pages/ReportsPage/ProjectReportsPage'
import SchedulerSplashscreen from '../BookingsPage/SchedulerSplashscreen'
import { AddonProjectPage } from '@/remote/AddonPages'
import { useProjectDefaultTab } from '@hooks/useProjectDefaultTab'
import BrowserPage from '@pages/BrowserPage'
import GuestUserPageLocked from '@components/GuestUserPageLocked'
import { ProjectContextProvider } from '@shared/context'
import { WithViews } from '@/hoc/WithViews'
import { ProjectPageRemote } from '@shared/components'
import {
  DetailsPanelEntityProvider,
  ProjectDataProvider,
} from '@shared/containers/ProjectTreeTable'
import { NewEntityProvider } from '@shared/containers/NewEntity'
import { useEntityListsContext } from '@pages/ProjectListsPage/context'
import { SimpleTableRow } from '@shared/containers/SimpleTable'
import { OnAddToList, OnOpenViewer } from '@shared/containers/Slicer'
import { ProjectNewEntityHost } from './ProjectNewEntityHost'
import {
  BROWSER_FLAG,
  PROJECT_BUILT_IN_MODULES,
  flattenTabs,
  isHiddenOwnedPage,
  useProjectNavigation,
} from '@containers/Navigation'

// what an addon page AYON reserves shows without its addon (or with an older addon)
const OWNED_PAGE_FALLBACKS = new Map<string, React.ComponentType<{ projectName: string }>>([
  ['scheduler', SchedulerSplashscreen],
  // an older reports addon has only the legacy page
  ['reports', ProjectReportsPage],
])

const ProjectContextInfo = () => {
  /**
   * Show a project context in a dialog
   * this is for development only
   */
  const context = useAppSelector((state) => state.context)
  const project = useAppSelector((state) => state.project)
  const [tab, setTab] = useState<'context' | 'project'>('context')
  return (
    <>
      <Toolbar style={{ marginBottom: 8 }}>
        {(['context', 'project'] as const).map((id) => (
          <Button
            key={id}
            variant={tab === id ? 'surface' : 'text'}
            selected={tab === id}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
            style={{ textTransform: 'capitalize' }}
          >
            {id}
          </Button>
        ))}
      </Toolbar>
      <JsonViewer value={tab === 'context' ? { context } : { project }} wrap />
    </>
  )
}

const SlicerWithViews = ({
  children,
  page,
  projectName,
  onAddToList,
  onOpenViewer,
}: {
  children: React.ReactNode
  page: string
  projectName: string
  onAddToList?: OnAddToList
  onOpenViewer?: OnOpenViewer
}) => {
  const { viewSettings, isLoadingViews } = useViewsContext()
  const { updateViewSettings } = useViewUpdateHelper()

  return (
    <SlicerProvider
      page={page}
      projectName={projectName}
      viewSettings={viewSettings}
      isLoadingViews={isLoadingViews}
      updateViewSettings={updateViewSettings}
      onOpenViewer={onOpenViewer}
      onAddToList={onAddToList}
    >
      {children}
    </SlicerProvider>
  )
}

const ProjectSlicerWithViews = ({
  children,
  page,
  projectName,
}: {
  children: React.ReactNode
  page: string
  projectName: string
}) => {
  const { buildReviewContextMenu } = useEntityListsContext()
  const dispatch = useAppDispatch()

  const onOpenViewer = useCallback<OnOpenViewer>(
    (row, currentProjectName) => {
      const isTask = row.data?.entityType === 'task'
      dispatch(
        openViewer({
          projectName: currentProjectName,
          quickView: true,
          ...(isTask ? { taskId: row.id } : { folderId: row.id }),
        }),
      )
    },
    [dispatch],
  )

  const onAddToList = useMemo<OnAddToList>(
    () => (row: SimpleTableRow, selectedRows: string[]) => {
      const entityType = row.data?.entityType === 'task' ? 'task' : 'folder'
      const selectedEntities = selectedRows.map((entityId) => ({ entityId, entityType }))
      return buildReviewContextMenu(entityType, selectedEntities)
    },
    [buildReviewContextMenu],
  )

  return (
    <SlicerWithViews
      page={page}
      projectName={projectName}
      onAddToList={onAddToList}
      onOpenViewer={onOpenViewer}
    >
      {children}
    </SlicerWithViews>
  )
}

const ProjectPageInner = () => {
  /**
   * This component is a wrapper for all project pages
   * It parses the url, loads the project data, dispatches the
   * project data to the store, and renders the requested page.
   */
  const { siteInfo } = useGlobalContext()
  const { uiExposureLevel = 0 } = siteInfo || {}
  // null in the generated type, a default value only covers undefined
  const frontendFlags = siteInfo?.frontendFlags ?? []
  const {
    projectName,
    name: loadedProjectName,
    label: projectLabel,
    isLoading,
    error,
  } = useProjectContext()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const params = useParams()
  const { addonName } = params
  let { module = '' } = params

  // if module is not in params, try to get it from the path
  // this happens for routes like /projects/:projectName/reviews/:sessionId
  if (!module) {
    const pathParts = pathname.split('/')
    if (pathParts[1] === 'projects' && pathParts[3]) {
      module = pathParts[3]
    }
  }

  const dispatch = useAppDispatch()
  const { onOpenImage, onGoToFrame, onOpenViewer, onUpdateEntity } = useDetailsPanelContext()
  const { trackCurrentTab } = useProjectDefaultTab()
  const [showContextDialog, setShowContextDialog] = useState(false)

  // the project's pages and their navigation items, from one registry
  const {
    items: navItems,
    addonsData,
    addonsLoading,
    addonsIsError,
    addonsListLoading,
    hasReview,
    remotePages,
    isLoadingModules,
    addonPages,
    isLoadingContributions,
    hiddenPages,
  } = useProjectNavigation(projectName)

  useEffect(() => {
    if (!addonsLoading && !addonsIsError && addonsData) {
      dispatch(selectProject(projectName))
    } else {
      // redirect to project manager
    }
  }, [addonsLoading, addonsIsError, addonsData, projectName, dispatch])

  const links: NavLinkItem[] = useMemo(
    () => [
      ...flattenTabs(navItems),
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
    [navItems, addonName, module],
  )

  const activeLink = useMemo(() => {
    return links.find((link) => link.module === module) || null
  }, [links, module])

  // the page's views load with the project instead of after it (the page waits for both)
  usePrefetchViews({ viewType: activeLink?.viewType, projectName })

  const title = useTitle(
    module,
    links,
    getProjectDisplayName({ name: projectName, label: projectLabel }) || 'AYON',
  )

  const tab = !!addonName ? addonsData?.find((item) => item.name === addonName)?.name : module
  const isAddon = !!addonName // Check if we're on an addon page
  useEffect(() => {
    trackCurrentTab(tab ?? '', isAddon)
  }, [tab, isAddon, trackCurrentTab])

  const getPageByModuleAndAddonData = (module: string, addonName?: string) => {
    let component: JSX.Element | null = <div>Module Not Found</div>,
      viewType = activeLink?.viewType

    const foundAddon = addonsData?.find((item) => item.name === addonName)
    const foundRemotePage = remotePages.find((item) => item.module === module)
    const foundAddonPage = addonPages.find((page) => page.id === module)

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
          isLoadingAccess={addonsListLoading}
          hasReviewAddon={hasReview}
        />
      )
    } else if (module === 'workfiles') {
      component = <WorkfilesPage />
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
            dispatch={dispatch}
            useSelector={useAppSelector}
            onOpenImage={onOpenImage}
            onGoToFrame={onGoToFrame}
            onOpenViewer={onOpenViewer}
            onUpdateEntity={onUpdateEntity}
          />
        </main>
      )
    } else if (foundAddonPage) {
      viewType = foundAddonPage.viewType
      component = (
        <main>
          <AddonProjectPage
            key={foundAddonPage.key}
            contribution={foundAddonPage}
            projectName={projectName}
          />
        </main>
      )
    } else {
      const Fallback = OWNED_PAGE_FALLBACKS.get(module)
      if (Fallback && !isHiddenOwnedPage(hiddenPages, module)) {
        component = <Fallback projectName={projectName} />
      } else {
        console.log('addon not found, redirecting to overview')
        // Fallback to versions page if no addon matches addonName
        component = null
      }
    }

    return { component, viewType }
  }

  const page = getPageByModuleAndAddonData(module, addonName)

  const handleNewVersionUploaded = (productId: string, versionId: string) => {
    // focus the new version in the versions
    dispatch(productSelected({ products: [productId], versions: [versionId] }))
  }

  // loading
  // only wait for what the current page needs: built in pages don't need the addon remote
  // modules, and only addon pages need the project addons list.
  // A refetch of the same project (isLoading includes isFetching) keeps the page mounted.
  const isBuiltInModule = !addonName && PROJECT_BUILT_IN_MODULES.includes(module)
  const isLoadingProject = isLoading && loadedProjectName !== projectName
  const loadingAll =
    !projectName ||
    isLoadingProject ||
    (!!addonName && addonsLoading) ||
    (!isBuiltInModule && (isLoadingModules || isLoadingContributions))

  // if we aren't loading anymore and there hasn't been a valid page component for a while, redirect to overview
  useEffect(() => {
    let timeoutId: any
    if (!loadingAll && !page.component) {
      timeoutId = setTimeout(() => {
        navigate(`/projects/${projectName}/overview`)
      }, 5000)
    }

    return () => clearTimeout(timeoutId)
  }, [loadingAll, page.component, navigate, projectName])

  useEffect(() => {
    if (loadingAll || !error) return
    const timeoutId = setTimeout(() => {
      navigate('/dashboard/tasks', { replace: true })
    }, 1500)

    return () => clearTimeout(timeoutId)
  }, [loadingAll, error, navigate])

  if (loadingAll) {
    return <LoadingPage />
  }

  // error
  if (error) {
    return <div className="page">Project Not Found, Redirecting...</div>
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
        <EntityListsProvider projectName={projectName}>
          <DetailsPanelEntityProvider>
            <WithViews viewType={page.viewType} projectName={projectName}>
              <EntityUpdatesProvider projectNames={[projectName]}>
                <ProjectSlicerWithViews page={module} projectName={projectName}>
                  <NewEntityProvider>
                    {module !== 'overview' && (
                      <ProjectNewEntityHost showButton={false} enableShortcuts={false} />
                    )}
                    {page.component}
                  </NewEntityProvider>
                </ProjectSlicerWithViews>
              </EntityUpdatesProvider>
            </WithViews>
          </DetailsPanelEntityProvider>
          <NewListFromContext />
        </EntityListsProvider>
        <UploadVersionDialog />
      </VersionUploadProvider>
    </ProjectContextProvider>
  )
}

const ProjectPage = () => {
  const { projectName } = useParams()
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(setOpenProject(projectName))
    return () => {
      dispatch(setOpenProject(null))
    }
  }, [projectName, dispatch])

  // umm... projectName is required
  if (!projectName) return <Navigate to="/" />

  return (
    <ProjectContextProvider projectName={projectName}>
      <ProjectFoldersContextProvider projectName={projectName}>
        <ProjectDataProvider projectName={projectName}>
          <ProjectPageInner />
        </ProjectDataProvider>
      </ProjectFoldersContextProvider>
    </ProjectContextProvider>
  )
}

export default ProjectPage
