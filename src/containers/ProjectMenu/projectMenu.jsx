import * as Styled from './projectMenu.styled'
import { useDispatch, useSelector } from 'react-redux'
import MenuList from '@components/Menu/MenuComponents/MenuList'
import { useListProjectsQuery } from '@queries/project/getProject'
import { useEffect, useMemo, useRef, useState } from 'react'
import { InputText, Section } from '@ynput/ayon-react-components'
import useCreateContext from '@hooks/useCreateContext'
import { useLocalStorage } from '@shared/hooks'
import ProjectButton from '@components/ProjectButton/ProjectButton'
import { createPortal } from 'react-dom'
import { useShortcutsContext } from '@context/shortcutsContext'
import clsx from 'clsx'
import { useSetFrontendPreferencesMutation } from '@/services/user/updateUser'
import useAyonNavigate from '@hooks/useAyonNavigate'
import { useProjectSelectDispatcher } from './hooks/useProjectSelectDispatcher'

const ProjectMenu = ({ isOpen, onHide }) => {
  const navigate = useAyonNavigate()
  const dispatch = useDispatch()
  const menuRef = useRef(null)
  const searchRef = useRef(null)
  const [oldPinned, setOldPinned] = useLocalStorage('projectMenu-pinned', [])
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
  const username = useSelector((state) => state.user?.name)
  const isUser = useSelector((state) => state.user?.data?.isUser)
  const pinnedState =
    useSelector((state) => state.user?.data?.frontendPreferences?.pinnedProjects) || []
  // merge pinned from user and local storage
  const pinned = [...new Set([...pinnedState, ...oldPinned])]

  const { data: projects = [] } = useListProjectsQuery({ active: true })

  const [showContext] = useCreateContext([])
  const [handleProjectSelectionDispatches] = useProjectSelectDispatcher([])

  const [updateUserPreferences] = useSetFrontendPreferencesMutation()

  const updatePinned = async (pinnedProjects) => {
    try {
      // update user preferences
      await updateUserPreferences({
        userName: username,
        patchData: { pinnedProjects: pinnedProjects },
      }).unwrap()

      // if local storage had pinned, remove it
      if (oldPinned.length > 0) {
        setOldPinned([])
        // remove local storage
        localStorage.removeItem('projectMenu-pinned')
      }

      return true
    } catch (error) {
      console.error('Error updating user preferences', error)
      return false
    }
  }

  const handlePinChange = (projectName, e) => {
    e.stopPropagation()
    const newPinned = [...pinned]
    if (pinned.includes(projectName)) {
      // remove from pinned
      newPinned.splice(newPinned.indexOf(projectName), 1)
    } else {
      // add to pinned
      newPinned.push(projectName)
    }

    // update user preferences
    updatePinned(newPinned)
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
            command: () =>
              setTimeout(
                dispatch((_, getState) =>
                  navigate(getState)(`/manageProjects/anatomy?project=${projectName}`),
                ),
                0,
              ),
          },
        ],
      )
    }

    return userItems
  }

  const handleEditClick = (e, projectName) => {
    e.stopPropagation()
    setTimeout(
      dispatch((_, getState) =>
        navigate(getState)(`/manageProjects/anatomy?project=${projectName}`),
      ),
      0,
    )
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
          className={clsx('project-item', { pinned: pinned.includes(project.name) })}
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

    handleProjectSelectionDispatches(projectName)

    setSearchOpen(false)

    // if projects/[project] is null, projects/[projectName]/overview, else projects/[projectName]/[module]
    const link = window.location.pathname.includes('projects')
      ? `/projects/${projectName}/${window.location.pathname.split('/')[3] || 'overview'}`
      : `/projects/${projectName}/overview`

    dispatch((_, getState) => navigate(getState)(link))
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
