import { useNavigate } from 'react-router-dom'
import * as Styled from './projectMenu.styled'
import { useDispatch, useSelector } from 'react-redux'
import { selectProject } from '/src/features/project'
import { selectProject as selectProjectContext, setUri } from '/src/features/context'
import { onProjectChange } from '/src/features/editor'
import { ayonApi } from '/src/services/ayon'
import MenuList from '/src/components/Menu/MenuComponents/MenuList'
import { useGetAllProjectsQuery } from '/src/services/project/getProject'
import { useMemo, useRef, useState } from 'react'
import { InputText, Section } from '@ynput/ayon-react-components'
import useCreateContext from '/src/hooks/useCreateContext'
import useLocalStorage from '/src/hooks/useLocalStorage'
import ProjectButton from '/src/components/ProjectButton/ProjectButton'

const ProjectMenu = ({ visible, onHide }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const searchRef = useRef(null)
  const [pinned, setPinned] = useLocalStorage('projectMenu-pinned', [])
  const [searchOpen, setSearchOpen] = useState(false)

  const projectSelected = useSelector((state) => state.project.name)
  const user = useSelector((state) => state.user)
  const isUser = user?.data?.isUser

  const [projectsFilter, setProjectsFilter] = useState('')

  const { data: projects = [] } = useGetAllProjectsQuery()

  const [showContext] = useCreateContext([])

  const handlePinChange = (projectName, e) => {
    e.stopPropagation()
    // e.originalEvent.preventDefault()
    if (pinned.includes(projectName)) {
      setPinned(pinned.filter((p) => p !== projectName))
    } else if (pinned.length < 5) {
      setPinned([...pinned, projectName])
    }
  }

  const buildContextMenu = (projectName) => {
    const isPinned = pinned.includes(projectName)
    const pinnedDisabled = pinned.length >= 5 && !isPinned

    const userItems = [
      {
        label: pinnedDisabled ? 'Max 5 pinned' : `${isPinned ? 'Unpin' : 'Pin'} Project`,
        icon: 'push_pin',
        command: (e) => handlePinChange(projectName, e),
        disabled: pinnedDisabled,
      },
    ]

    if (!isUser) {
      userItems.push(
        ...[
          {
            label: 'Project Settings',
            icon: 'settings_applications',
            command: () => navigate(`/manageProjects/anatomy?project=${projectName}`),
          },
        ],
      )
    }

    return userItems
  }

  const handleEditClick = (e, name) => {
    e.stopPropagation()
    navigate(`/manageProjects/anatomy?project=${name}`)
    onHide()
  }

  const menuItems = useMemo(() => {
    return projects.map((project) => ({
      id: project.name,
      label: project.name,
      pinned: pinned.includes(project.name),
      node: (
        <ProjectButton
          label={project.name}
          className={pinned.includes(project.name) ? 'pinned' : ''}
          onPin={(e) => handlePinChange(project.name, e)}
          onEdit={!isUser && ((e) => handleEditClick(e, project.name))}
          onClick={() => onProjectSelect(project.name)}
          onContextMenu={(e) => showContext(e, buildContextMenu(project.name))}
        />
      ),
    }))
  }, [projects, projectSelected, projectsFilter, pinned])

  // sort  by pinned, then alphabetically
  const sortedMenuItems = useMemo(() => {
    return menuItems.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      if (a.label[0] < b.label[0]) return -1
      if (a.label[0] > b.label[0]) return 1
      return 0
    })
  }, [menuItems])

  // after the last pinned item, insert a divider
  const dividerIndex = useMemo(() => {
    return sortedMenuItems.findIndex((item) => !item.pinned)
  }, [sortedMenuItems])

  // now we have a divider index, we can insert a divider
  const menuItemsWithDivider = useMemo(() => {
    const items = [...sortedMenuItems]
    if (pinned.length) items.splice(dividerIndex, 0, { id: 'divider' })
    return items
  }, [sortedMenuItems, dividerIndex])

  const filteredMenuItems = useMemo(() => {
    return menuItemsWithDivider.filter((item) => {
      return !projectsFilter || item?.label?.toLowerCase().includes(projectsFilter.toLowerCase())
    })
  }, [menuItems, projectsFilter])

  const onProjectSelect = (projectName) => {
    onHide()

    // if already on project page, do not navigate
    if (window.location.pathname.includes(projectName)) return

    // reset selected folders
    dispatch(selectProject(projectName))
    // reset context for projects
    dispatch(selectProjectContext(projectName))
    // reset editor
    dispatch(onProjectChange(projectName))
    // remove editor query caches
    dispatch(ayonApi.util.invalidateTags(['branch', 'workfile', 'hierarchy', 'project', 'product']))
    // reset uri
    dispatch(setUri(`ayon+entity://${projectName}`))

    // close search if it was open
    setSearchOpen(false)

    // if projects/[project] is null, projects/[projectName]/browser, else projects/[projectName]/[module]
    const link = window.location.pathname.includes('projects')
      ? `/projects/${projectName}/${window.location.pathname.split('/')[3] || 'browser'}`
      : `/projects/${projectName}/browser`

    navigate(link)
  }

  const handleHide = () => {
    onHide()
    // close search if it was open
    setSearchOpen(false)
  }

  const handleSearchClick = (e) => {
    e.stopPropagation()
    setSearchOpen(true)
  }

  if (!visible) return null

  return (
    <Styled.ProjectSidebar
      position="left"
      visible={true}
      modal={false}
      showCloseIcon={false}
      onShow={() => searchRef.current?.focus()}
      onHide={handleHide}
    >
      <Section>
        {!searchOpen ? (
          <Styled.Search icon="search" variant="text" onClick={handleSearchClick} />
        ) : (
          <InputText
            placeholder="Search projects..."
            value={projectsFilter}
            onChange={(e) => setProjectsFilter(e.target.value)}
            ref={searchRef}
            autoFocus
          />
        )}

        <Styled.All>
          <h3>Projects</h3>
          <MenuList items={filteredMenuItems} handleClick={(e, onClick) => onClick()} level={0} />
        </Styled.All>
      </Section>
    </Styled.ProjectSidebar>
  )
}

export default ProjectMenu
