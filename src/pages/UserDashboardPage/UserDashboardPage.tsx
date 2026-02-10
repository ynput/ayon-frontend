import React, { useMemo, useState } from 'react'
import AppNavLinks from '@containers/header/AppNavLinks'
import { useNavigate, useParams } from 'react-router-dom'
import UserTasksContainer from './UserDashboardTasks/UserTasksContainer'
import { Section } from '@ynput/ayon-react-components'
import { useDispatch } from 'react-redux'
import { onProjectSelected } from '@state/dashboard'
import { useGetProjectsInfoQuery } from '@shared/api'
import { useListProjectsQuery } from '@shared/api'
import UserDashboardNoProjects from './UserDashboardNoProjects/UserDashboardNoProjects'
import ProjectDashboard from '../ProjectDashboard'
import NewProjectDialog from '../ProjectManagerPage/NewProjectDialog'
import { useDeleteProjectMutation, useUpdateProjectMutation } from '@shared/api'
import { confirmDelete } from '@shared/util'
import { useGetDashboardAddonsQuery } from '@shared/api'
import DashboardAddon from '@pages/ProjectDashboard/DashboardAddon'
import ProjectsList, { PROJECTS_LIST_WIDTH_KEY } from '@containers/ProjectsList/ProjectsList'
import { parseProjectFolderRowId } from '@containers/ProjectsList/buildProjectsTableData'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import GuestUserPageLocked from '@components/GuestUserPageLocked'
import styled from 'styled-components'
import DocumentTitle from '@components/DocumentTitle/DocumentTitle'
import useTitle from '@hooks/useTitle'
import HelpButton from '@components/HelpButton/HelpButton'
import { UserDashboardProvider } from './context/UserDashboardContext'
import { useAppSelector } from '@/features/store'
import type { ReactNode } from 'react'
import type { NavLinkItem } from '@containers/header/AppNavLinks'
import { useLoadRemotePages } from '@/remote/useLoadRemotePages'
import { UserDashboardPageRemote } from './UserDashboardPageRemote'
import LoadingPage from '@pages/LoadingPage'
import { WithViews } from '@/hoc/WithViews'
import { ViewType } from '@shared/containers'

interface DashboardAddon {
  name: string
  title: string
  version: string
  settings?: {
    admin?: boolean
    manager?: boolean
  }
}

interface ProjectInfo {
  projectNames: Array<{ id: string; name: string }>
  [key: string]: any
}

type PageLink = NavLinkItem & {
  component?: ReactNode
  viewType?: ViewType
  showProjectList?: boolean
  isMultiSelect?: boolean
}

const StyledSplitter = styled(Splitter)`
  height: 100%;
  overflow: hidden;
  position: relative;
  display: flex;

  .p-splitter-gutter {
    z-index: 50;
  }
`

const UserDashboardPage: React.FC = () => {
  const { module, addonName } = useParams<{ module?: string; addonName?: string }>()
  const user = useAppSelector((state: any) => state.user)
  const isAdmin = user?.data?.isAdmin
  const isManager = user?.data?.isManager
  const isGuest = user?.data?.isGuest

  const {
    data: addonsData = [],
    //isLoading: addonsLoading,
    //isError: addonsIsError,
  } = useGetDashboardAddonsQuery({})

  // Load remote Studio pages
  const { remotePages, isLoading: isLoadingRemotePages } = useLoadRemotePages({
    moduleKey: 'Studio',
    skip: false,
  })

  const navigate = useNavigate()
  const [showNewProject, setShowNewProject] = useState<boolean>(false)

  //   redux states
  const dispatch = useDispatch()
  //   selected projects
  const selectedProjects = useAppSelector((state: any) => state.dashboard.selectedProjects)
  const setSelectedProjects = (projects: string[]) => dispatch(onProjectSelected(projects))

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

  // get projects list
  const { data: projects = [], isLoading: isLoadingProjects } = useListProjectsQuery({})

  // attach projects: ['project_name'] to each projectInfo
  const projectsInfoWithProjects = useMemo(() => {
    const projectsInfoWithProjects: Record<string, ProjectInfo> = {}
    for (const key in projectsInfo) {
      const projectInfo = projectsInfo[key]
      projectsInfoWithProjects[key] = { ...projectInfo, projectNames: [{ id: key, name: key }] }
    }
    return projectsInfoWithProjects
  }, [projectsInfo, isLoadingInfo])

  // UPDATE/DELETE PROJECT
  const [updateProject] = useUpdateProjectMutation()
  const [deleteProject] = useDeleteProjectMutation()

  const handleDeleteProject = (sel: string) => {
    confirmDelete({
      label: `Project: ${sel}`,
      accept: async () => {
        await deleteProject({ projectName: sel }).unwrap()
        setSelectedProjects([])
      },
    })
  }

  const handleActivateProject = async (sel: string, active: boolean) => {
    await updateProject({ projectName: sel, projectPatchModel: { active } }).unwrap()
  }

  // Build pages configuration - single source of truth for navigation and components
  const pages: PageLink[] = useMemo(
    () => [
      {
        name: 'Tasks',
        path: '/dashboard/tasks',
        module: 'tasks',
        accessLevels: [],
        shortcut: 'H+H',
        component: (
          <UserTasksContainer
            projectsInfo={projectsInfoWithProjects}
            isLoadingInfo={isLoadingInfo}
          />
        ),
        // viewType: 'tasks',
        showProjectList: true,
        isMultiSelect: true,
      },
      {
        name: 'Dashboard',
        path: '/dashboard/dashboard',
        module: 'dashboard',
        accessLevels: [],
        component: <ProjectDashboard projectName={selectedProjectNames[0]} />,
        showProjectList: true,
        isMultiSelect: false,
      },
      // Add legacy dashboard addons
      ...(addonsData as DashboardAddon[])
        .filter((addon) => {
          if (addon?.settings?.admin && !isAdmin) return false
          if (addon?.settings?.manager && !isManager) return false
          return true
        })
        .map((addon) => ({
          name: addon.title,
          path: `/dashboard/addon/${addon.name}`,
          module: addon.name,
          component: <DashboardAddon addonName={addon.name} addonVersion={addon.version} />,
          showProjectList: false,
        })),
      // Add remote Studio pages
      ...remotePages.map((remote) => {
        const showProjectList = !!(remote as any).projects
        return {
          name: remote.name || remote.module,
          path: `/dashboard/${remote.module}`,
          module: remote.module,
          component: (
            <UserDashboardPageRemote
              Component={remote.component}
              viewType={remote.viewType}
              state={showProjectList ? { selectedProjects } : undefined}
              key={remote.id}
            />
          ),
          viewType: remote.viewType,
          showProjectList,
          isMultiSelect: false,
        }
      }),
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
    [
      addonsData,
      remotePages,
      projectsInfoWithProjects,
      isLoadingInfo,
      selectedProjects,
      selectedProjectNames,
      isAdmin,
      isManager,
      addonName,
      module,
    ],
  )

  const links: NavLinkItem[] = useMemo(() => {
    return pages.map(({ isMultiSelect, showProjectList, ...props }) => ({
      ...props,
    }))
  }, [pages])

  // Find active page based on current module/addonName
  const activePage = useMemo(() => {
    if (addonName) {
      return pages.find((p) => p.module === addonName)
    }
    return pages.find((p) => p.module === module) || pages.find((p) => p.module === 'tasks')
  }, [pages, module, addonName])

  const title = useTitle(addonName || module || '', pages, 'AYON', '')

  // Early returns after all hooks
  if (isLoadingProjects || isLoadingRemotePages) return <LoadingPage />

  if (!projects.length) return <UserDashboardNoProjects />

  if (isGuest) {
    return <GuestUserPageLocked />
  }

  if (!activePage?.component) return null

  const {
    component: moduleComponent,
    showProjectList = false,
    isMultiSelect = false,
    viewType,
  } = activePage

  return (
    <>
      <DocumentTitle title={title} />
      <AppNavLinks links={links} />
      <UserDashboardProvider>
        <main>
          <WithViews viewType={viewType}>
            <Section direction="row" wrap style={{ position: 'relative', overflow: 'hidden' }}>
              {showProjectList ? (
                <StyledSplitter stateKey={PROJECTS_LIST_WIDTH_KEY} stateStorage="local">
                  <SplitterPanel size={15}>
                    <ProjectsList
                      multiSelect={isMultiSelect}
                      selection={selectedProjects}
                      onSelect={setSelectedProjects}
                      onNewProject={() => setShowNewProject(true)}
                      onDeleteProject={handleDeleteProject}
                      onActivateProject={handleActivateProject}
                    />
                  </SplitterPanel>
                  <SplitterPanel size={100} style={{ overflow: 'hidden' }}>
                    {moduleComponent}
                  </SplitterPanel>
                </StyledSplitter>
              ) : (
                moduleComponent
              )}
            </Section>
          </WithViews>
        </main>
        {showNewProject && (
          <NewProjectDialog
            onHide={(name?: string) => {
              setShowNewProject(false)
              if (name) navigate(`/manageProjects/anatomy?project=${name}`)
            }}
          />
        )}
      </UserDashboardProvider>
    </>
  )
}

export default UserDashboardPage
