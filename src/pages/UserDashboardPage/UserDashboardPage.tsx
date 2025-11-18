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

  const links: NavLinkItem[] = [
    {
      name: 'Tasks',
      path: '/dashboard/tasks',
      module: 'tasks',
      accessLevels: [],
      shortcut: 'H+H',
    },
    {
      name: 'Overview',
      path: '/dashboard/overview',
      module: 'overview',
      accessLevels: [],
    },
  ]

  for (const addon of addonsData as DashboardAddon[]) {
    if (addon?.settings?.admin && !isAdmin) continue
    if (addon?.settings?.manager && !isManager) continue
    links.push({
      name: addon.title,
      path: `/dashboard/addon/${addon.name}`,
      module: addon.name,
    })
  }
  links.push({ node: 'spacer' })
  links.push({
    node: (
      <HelpButton
        module={addonName || (module === 'overview' ? 'dashboard overview' : module) || 'tasks'}
      />
    ),
  })

  const title = useTitle(addonName || module || '', links, 'AYON', '')

  const addonData = (addonsData as DashboardAddon[]).find((addon) => addon.name === addonName)

  const addonModule = addonData ? (
    <DashboardAddon addonName={addonData.name} addonVersion={addonData.version} />
  ) : null

  const navigate = useNavigate()
  const [showNewProject, setShowNewProject] = useState<boolean>(false)

  //   redux states
  const dispatch = useDispatch()
  //   selected projects
  const selectedProjects = useAppSelector((state: any) => state.dashboard.selectedProjects)
  const setSelectedProjects = (projects: string[]) => dispatch(onProjectSelected(projects))

  // get all the info required for the projects selected, like status icons and colours
  const { data: projectsInfo = {}, isFetching: isLoadingInfo } = useGetProjectsInfoQuery(
    { projects: selectedProjects },
    { skip: !selectedProjects?.length },
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

  const isProjectsMultiSelect = module === 'tasks'
  const showProjectList = module === 'tasks' || module === 'overview'

  if (isLoadingProjects) return null

  if (!projects.length) return <UserDashboardNoProjects />

  let moduleComponent: ReactNode
  if (!!addonName && addonModule) {
    moduleComponent = addonModule
  } else {
    switch (module) {
      case 'tasks':
        moduleComponent = (
          <UserTasksContainer
            projectsInfo={projectsInfoWithProjects}
            isLoadingInfo={isLoadingInfo}
          />
        )
        break
      case 'overview':
        moduleComponent = <ProjectDashboard projectName={selectedProjects[0]} />
        break
      default:
        moduleComponent = (
          <UserTasksContainer
            projectsInfo={projectsInfoWithProjects}
            isLoadingInfo={isLoadingInfo}
          />
        )
        break
    }
  }

  if (isGuest) {
    return <GuestUserPageLocked />
  }

  return (
    <>
      <DocumentTitle title={title} />
      <AppNavLinks links={links} />
      <UserDashboardProvider>
        <main>
          <Section direction="row" wrap style={{ position: 'relative', overflow: 'hidden' }}>
            {showProjectList ? (
              <StyledSplitter stateKey={PROJECTS_LIST_WIDTH_KEY} stateStorage="local">
                <SplitterPanel size={15}>
                  <ProjectsList
                    multiSelect={isProjectsMultiSelect}
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
