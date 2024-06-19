import { useNavigate } from 'react-router-dom'
import * as Styled from './projectMenu.styled'
import { useDispatch, useSelector } from 'react-redux'
import { selectProject } from '@state/project'
import { selectProject as selectProjectContext, setUri } from '@state/context'
import { onProjectChange } from '@state/editor'
import { ayonApi } from '@queries/ayon'
import MenuList from '@components/Menu/MenuComponents/MenuList'
import { useListProjectsQuery } from '@queries/project/getProject'
import { useEffect, useMemo, useRef, useState } from 'react'
import { InputText, Section } from '@ynput/ayon-react-components'
import useCreateContext from '@hooks/useCreateContext'
import useLocalStorage from '@hooks/useLocalStorage'
import ProjectButton from '@components/ProjectButton/ProjectButton'
import { createPortal } from 'react-dom'
import { useShortcutsContext } from '@context/shortcutsContext'
import { classNames } from 'primereact/utils'
import { onProjectOpened } from '/src/features/dashboard'

const ProjectMenu = ({ isOpen, onHide }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const menuRef = useRef(null)
  const searchRef = useRef(null)
  const [pinned, setPinned] = useLocalStorage('projectMenu-pinned', [])
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')

  // disable
  const { setAllowed } = useShortcutsContext()

  useEffect(() => {
    if (isOpen) {
      // open only allow project menu shortcuts (block all others)
      setAllowed(['1', '0', '9', '8'])
    } else {
      // close allow all shortcuts
      setAllowed([])
      // clear search
      setSearch('')
    }
  }, [isOpen])

  useEffect(() => {
    if (menuRef.current && isOpen) {
      const el = menuRef.current?.getElement()

      if (el) el.focus()
    }
  }, [menuRef.current, isOpen])

  const projectSelected = useSelector((state) => state.project.name)
  const user = useSelector((state) => state.user)
  const isUser = user?.data?.isUser

  const { data: projects = [] } = useListProjectsQuery({ active: true })

  const [showContext] = useCreateContext([])

  const handlePinChange = (projectName, e) => {
    e.stopPropagation()
    // e.originalEvent.preventDefault()
    if (pinned.includes(projectName)) {
      // remove from pinned
      setPinned(pinned.filter((p) => p !== projectName))
    } else {
      // add to pinned
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
          code={project.code}
          className={classNames('project-item', { pinned: pinned.includes(project.name) })}
          highlighted={projectSelected === project.name}
          onPin={(e) => handlePinChange(project.name, e)}
          onEdit={!isUser && ((e) => handleEditClick(e, project.name))}
          onClick={() => onProjectSelect(project.name)}
          onContextMenu={(e) => showContext(e, buildContextMenu(project.name))}
          id={project.name}
          key={project.name}
        />
      ),
    }))
  }, [projects, projectSelected, search, pinned])

  // sort  by pinned, then alphabetically
  const sortedMenuItems = useMemo(() => {
    return menuItems.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      if (a.label.toLowerCase() < b.label.toLowerCase()) return -1
      if (a.label.toLowerCase() > b.label.toLowerCase()) return 1
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
    if (pinned.length !== items.length) items.splice(dividerIndex, 0, { id: 'divider' })
    return items
  }, [sortedMenuItems, dividerIndex])

  const filteredMenuItems = useMemo(() => {
    return menuItemsWithDivider.filter((item) => {
      return !search || item?.label?.toLowerCase().includes(search.toLowerCase())
    })
  }, [menuItems, search])

  const handleHide = () => {
    onHide()
    // close search if it was open
    setSearchOpen(false)
    // clear search
    setSearch('')
  }

  const onProjectSelect = (projectName) => {
    handleHide()

    // if already on project page, do not navigate
    if (window.location.pathname.split('/')[2] === projectName) return

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
    // set dashboard projects
    dispatch(onProjectOpened(projectName))

    // close search if it was open
    setSearchOpen(false)

    // if projects/[project] is null, projects/[projectName]/browser, else projects/[projectName]/[module]
    const link = window.location.pathname.includes('projects')
      ? `/projects/${projectName}/${window.location.pathname.split('/')[3] || 'browser'}`
      : `/projects/${projectName}/browser`

    navigate(link)
  }

  const handleSearchClick = (e) => {
    e.stopPropagation()
    setSearchOpen(true)
  }
  const focusElement = (element) => {
    if (element) {
      element.focus()
    }
  }

  const getSibling = (element, direction) => {
    const sibling =
      direction === 'next' ? element.nextElementSibling : element.previousElementSibling
    return sibling?.tagName === 'HR' ? getSibling(sibling, direction) : sibling
  }

  const handleArrowKeys = (e) => {
    const { key, shiftKey } = e
    const direction = key === 'ArrowUp' || (key === 'Tab' && shiftKey) ? 'prev' : 'next'
    const edgeElement = direction === 'next' ? 'firstChild' : 'lastChild'

    if (['ArrowDown', 'ArrowUp'].includes(key) || (key === 'Tab' && (shiftKey || !shiftKey))) {
      e.preventDefault()
      const focused = document.activeElement

      if (focused && focused.className.includes('project-item')) {
        const sibling = getSibling(focused, direction)
        focusElement(sibling || focused.parentElement[edgeElement])
      } else {
        const edgeItem = menuRef.current.getElement()?.querySelector(`.project-item`)
        focusElement(edgeItem)
      }
    }
  }

  // if we start typing, open the search automatically
  const handleKeyPress = (e) => {
    //  open search on letter
    if (e.key?.length === 1 && !searchOpen) {
      setSearchOpen(true)
    }

    // close search on escape
    // close menu on escape (if search is not open)
    if (e.key === 'Escape') {
      if (searchOpen && search.length > 0) {
        setSearchOpen(false)
        setSearch('')
      } else {
        handleHide()
      }
    }
    // pick top result on enter and search
    else if (e.key === 'Enter') {
      // get id of focused item
      const id = e.target?.id

      if (id) {
        // select project
        onProjectSelect(id)
      } else if (searchOpen && search.length > 0 && filteredMenuItems.length > 0) {
        // select top result
        const topResult = filteredMenuItems[0]
        if (topResult) {
          onProjectSelect(topResult.label)
        }
      }
    } else if (e.key === 'Backspace') {
      if (searchOpen && search.length > 0) {
        // focus on search input
        focusElement(searchRef.current)
      }
    } else handleArrowKeys(e)
  }
  // Add event listeners
  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyPress)
    } else {
      window.removeEventListener('keydown', handleKeyPress)
    }

    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [handleKeyPress, isOpen])

  if (!isOpen) return null

  return (
    <>
      {createPortal(<Styled.Overlay />, document.body)}
      <Styled.ProjectSidebar
        position="left"
        visible={true}
        modal={false}
        showCloseIcon={false}
        onHide={handleHide}
        closeOnEscape={false}
        ref={menuRef}
        className="project-menu"
      >
        <Section>
          {!searchOpen ? (
            <Styled.Search icon="search" variant="text" onClick={handleSearchClick} />
          ) : (
            <InputText
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              ref={searchRef}
            />
          )}

          <Styled.All>
            <h3>Projects</h3>
            <MenuList items={filteredMenuItems} handleClick={(e, onClick) => onClick()} level={0} />
          </Styled.All>
        </Section>
      </Styled.ProjectSidebar>
    </>
  )
}

export default ProjectMenu
