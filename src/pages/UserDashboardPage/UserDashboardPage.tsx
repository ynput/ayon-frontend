import React, { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import AppNavLinks from '@containers/header/AppNavLinks'
import { useNavigate, useParams } from 'react-router-dom'
import UserTasksContainer from './UserDashboardTasks/UserTasksContainer'
import { Section } from '@ynput/ayon-react-components'
import { useDispatch } from 'react-redux'
import { onProjectSelected } from '@state/dashboard'
import { useGetProjectsInfoQuery } from '@shared/api'
import { useGlobalContext } from '@shared/context'
import DashboardAddon from './DashboardAddon'
import ProjectsList from '@containers/ProjectsList/ProjectsList'
import { parseProjectFolderRowId } from '@shared/containers/ProjectsTable'
import GuestUserPageLocked from '@components/GuestUserPageLocked'
import DocumentTitle from '@components/DocumentTitle/DocumentTitle'
import useTitle from '@hooks/useTitle'
import HelpButton from '@components/HelpButton/HelpButton'
import { UserDashboardProvider } from './context/user-dashboard'
import { useAppSelector } from '@/features/store'
import type { ReactNode } from 'react'
import type { NavLinkItem } from '@containers/header/AppNavLinks'
import { AddonStudioPage } from '@/remote/AddonPages'
import {
  StudioPageLayoutHost,
  StudioPageSelectionProvider,
} from '@shared/components/AddonLayout/StudioPageLayout'
import { ProjectList, StudioPageLayout } from '@ynput/ayon-addon'
import { UserDashboardPageRemote } from './UserDashboardPageRemote'
import LoadingPage from '@pages/LoadingPage'
import { WithViews } from '@/hoc/WithViews'
import { ViewType } from '@shared/containers'
import { ProjectsPage } from '@pages/ProjectsPage'
import BookingsSplashscreen from '../BookingsPage/BookingsSplashscreen'
import { STUDIO_BUILT_IN_MODULES, flattenTabs, useStudioNavigation } from '@containers/Navigation'

interface ProjectInfo {
  projectNames: Array<{ id: string; name: string }>
  [key: string]: any
}

// what renders for a module; its tab comes from the navigation registry
type PageContent = {
  module: string
  component?: ReactNode
  viewType?: ViewType
  showProjectList?: boolean
  isMultiSelect?: boolean
  // page only makes sense with at least one project; shows the "No Projects" state otherwise
  requiresProjects?: boolean
}

// these pull in the settings editor (new project dialog), only load them when they are shown
const NewProjectDialog = lazy(() => import('../ProjectManagerPage/NewProjectDialog'))
const UserDashboardNoProjects = lazy(
  () => import('./UserDashboardNoProjects/UserDashboardNoProjects'),
)


const UserDashboardPage: React.FC = () => {
  const { module, addonName } = useParams<{ module?: string; addonName?: string }>()
  const user = useAppSelector((state: any) => state.user)
  const isGuest = user?.data?.isGuest

  // Home's pages and their navigation items, from one registry
  const {
    items: navItems,
    dashboardAddons,
    remotePages,
    isLoadingRemotePages,
    addonStudioPages,
    isLoadingContributions,
    hasPlanner,
  } = useStudioNavigation()

  const navigate = useNavigate()
  const [showNewProject, setShowNewProject] = useState<boolean>(false)
  const {
    projects: { all: projects },
    isLoading: globalIsLoading,
  } = useGlobalContext()

  //   redux states
  const dispatch = useDispatch()
  //   selected projects
  const selectedProjects = useAppSelector((state: any) => state.dashboard.selectedProjects)
  const setSelectedProjects = useCallback(
    (projects: string[]) => dispatch(onProjectSelected(projects)),
    [dispatch],
  )
  // legacy studio pages with the `projects` key share the dashboard's selection
  const legacyStudioSelection = useMemo(
    () => ({
      selection: selectedProjects,
      onSelect: setSelectedProjects,
      onNewProject: () => setShowNewProject(true),
    }),
    [selectedProjects, setSelectedProjects],
  )

  // Filter out folder IDs from selection - only actual project names should be used for API queries
  const selectedProjectNames = useMemo(
    () => selectedProjects.filter((id: string) => !parseProjectFolderRowId(id)),
    [selectedProjects],
  )

  // get all the info required for the projects selected, like status icons and colours
  const { data: projectsInfo = {}, isFetching: isLoadingInfo } = useGetProjectsInfoQuery(
    { projects: selectedProjectNames },
    { skip: !selectedProjectNames?.length },
  )

  const isLoadingProjects = globalIsLoading.projects

  // attach projects: ['project_name'] to each projectInfo
  const projectsInfoWithProjects = useMemo(() => {
    const projectsInfoWithProjects: Record<string, ProjectInfo> = {}
    for (const key in projectsInfo) {
      const projectInfo = projectsInfo[key]
      projectsInfoWithProjects[key] = { ...projectInfo, projectNames: [{ id: key, name: key }] }
    }
    return projectsInfoWithProjects
  }, [projectsInfo, isLoadingInfo])

  // what renders for each module; the tabs come from the navigation registry
  const pages: PageContent[] = useMemo(
    () => [
      {
        module: 'tasks',
        component: (
          <UserTasksContainer
            projectsInfo={projectsInfoWithProjects}
            isLoadingInfo={isLoadingInfo}
          />
        ),
        showProjectList: true,
        isMultiSelect: true,
        requiresProjects: true,
      },
      {
        module: 'projects',
        viewType: 'projects-overview',
        component: <ProjectsPage onNewProject={() => setShowNewProject(true)} />,
        showProjectList: false,
        requiresProjects: true,
      },
      // Show bookings splash when planner addon is not installed;
      // when installed the remote page from the planner addon handles /dashboard/bookings
      ...(!hasPlanner
        ? [{ module: 'planner', component: <BookingsSplashscreen />, showProjectList: false }]
        : []),
      // legacy dashboard addons
      ...dashboardAddons.map((addon) => ({
        module: addon.name,
        component: <DashboardAddon addonName={addon.name} addonVersion={addon.version} />,
        showProjectList: false,
      })),
      // remote Studio pages
      ...remotePages.map((remote) => {
        const showProjectList = !!(remote as any).projects
        const page = (
          <UserDashboardPageRemote
            Component={remote.component}
            viewType={remote.viewType}
            state={showProjectList ? { selectedProjects } : undefined}
            key={remote.id}
          />
        )
        return {
          module: remote.module,
          // the `projects` key renders through the layout components studio.page contributions use
          component: showProjectList ? (
            <StudioPageSelectionProvider value={legacyStudioSelection} key={remote.id}>
              <StudioPageLayout sidebar={<ProjectList />}>{page}</StudioPageLayout>
            </StudioPageSelectionProvider>
          ) : (
            page
          ),
          viewType: remote.viewType,
          showProjectList: false,
          isMultiSelect: false,
        }
      }),
      ...addonStudioPages.map((page) => ({
        module: page.id,
        component: (
          <AddonStudioPage
            contribution={page}
            onNewProject={() => setShowNewProject(true)}
            key={page.key}
          />
        ),
        viewType: page.viewType as ViewType | undefined,
        showProjectList: false,
      })),
    ],
    [
      dashboardAddons,
      remotePages,
      addonStudioPages,
      legacyStudioSelection,
      projectsInfoWithProjects,
      isLoadingInfo,
      selectedProjects,
      hasPlanner,
    ],
  )

  const links: NavLinkItem[] = useMemo(
    () => [
      ...flattenTabs(navItems),
      { node: 'spacer' },
      {
        node: (
          <HelpButton
            module={
              addonName || (module === 'dashboard' ? 'dashboard dashboard' : module) || 'tasks'
            }
          />
        ),
      },
    ],
    [navItems, addonName, module],
  )

  // Find active page based on current module/addonName; a page opens only with its tab
  const activePage = useMemo(() => {
    const opens = (p: PageContent) => links.some((link) => link.module === p.module)
    if (addonName) {
      return pages.find((p) => p.module === addonName && opens(p))
    }
    return (
      pages.find((p) => p.module === module && opens(p)) || pages.find((p) => p.module === 'tasks')
    )
  }, [pages, links, module, addonName])

  const title = useTitle(addonName || module || '', links, 'AYON', '')

  // Early returns after all hooks
  // the built in pages render while the projects load (the projects list shows its own loading
  // state), so their data, e.g. the tasks of the selected projects, starts loading straight away
  const isBuiltInPage = !addonName && (!module || STUDIO_BUILT_IN_MODULES.includes(module))
  if (!isBuiltInPage && (isLoadingProjects || isLoadingRemotePages || isLoadingContributions))
    return <LoadingPage />

  if (isGuest) {
    return <GuestUserPageLocked />
  }

  if (!activePage?.component) return null

  // Keep the tab bar and non-project pages (e.g. addon studio pages used for first-run setup)
  // reachable on a server with no projects; only project-based pages show the empty state.
  const showNoProjects = !isLoadingProjects && !projects.length && !!activePage.requiresProjects

  const {
    component: moduleComponent,
    showProjectList = false,
    isMultiSelect = false,
    viewType,
  } = showNoProjects
    ? {
        component: (
          <Suspense fallback={<LoadingPage />}>
            <UserDashboardNoProjects />
          </Suspense>
        ),
        showProjectList: false,
        isMultiSelect: false,
        viewType: undefined,
      }
    : activePage

  return (
    <>
      <DocumentTitle title={title} />
      <AppNavLinks links={links} />
      <UserDashboardProvider>
        <main>
          <WithViews viewType={viewType}>
            <Section direction="row" wrap style={{ position: 'relative', overflow: 'hidden' }}>
              <StudioPageLayoutHost
                sidebar={
                  showProjectList && (
                    <ProjectsList
                      multiSelect={isMultiSelect}
                      selection={selectedProjects}
                      onSelect={setSelectedProjects}
                      onNewProject={() => setShowNewProject(true)}
                    />
                  )
                }
              >
                {moduleComponent}
              </StudioPageLayoutHost>
            </Section>
          </WithViews>
        </main>
        {showNewProject && (
          <Suspense fallback={null}>
            <NewProjectDialog
              onHide={(name?: string) => {
                setShowNewProject(false)
                if (name) navigate(`/manageProjects/anatomy?project=${name}`)
              }}
              redirect={module !== 'projects'}
            />
          </Suspense>
        )}
      </UserDashboardProvider>
    </>
  )
}

export default UserDashboardPage
