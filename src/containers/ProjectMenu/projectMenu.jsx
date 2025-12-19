import * as Styled from './projectMenu.styled'
import { useDispatch, useSelector } from 'react-redux'
import { MenuList } from '@shared/components'
import {
  useGetProjectFoldersQuery,
  useListProjectsQuery,
  useSetFrontendPreferencesMutation,
} from '@shared/api'
import { useEffect, useMemo, useRef, useState } from 'react'
import { InputText, Section } from '@ynput/ayon-react-components'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import { useLocalStorage } from '@shared/hooks'
import ProjectButton from '@components/ProjectButton/ProjectButton'
import { createPortal } from 'react-dom'
import { useShortcutsContext } from '@context/ShortcutsContext'
import clsx from 'clsx'
import { useProjectSelectDispatcher } from './hooks/useProjectSelectDispatcher'
import { updateUserPreferences as updateUserPreferencesAction } from '@state/user'
import { useProjectDefaultTab } from '@hooks/useProjectDefaultTab'
import { useLocation, useNavigate } from 'react-router-dom'
import buildProjectsTableData from '@containers/ProjectsList/buildProjectsTableData'
import { powerpackFeatures } from '@shared/context'

const ProjectMenu = ({ isOpen, onHide }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const location = useLocation()
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
  const {powerLicense} = powerpackFeatures

  const { data: projects = [] } = useListProjectsQuery({ active: true })
  const { data: folders = [] } = useGetProjectFoldersQuery({active: true})
  const projectTree = useMemo(
    () => buildProjectsTableData(projects, folders, true, powerLicense),
    [projects, folders, powerLicense],
  )
  const [showContext] = useCreateContextMenu([])
  const [handleProjectSelectionDispatches] = useProjectSelectDispatcher([])
  const { getDefaultTab } = useProjectDefaultTab()

  const [updateUserPreferences] = useSetFrontendPreferencesMutation()

  const updatePinned = async (pinnedProjects) => {
    try {
      // update in local redux state
      dispatch(updateUserPreferencesAction({ pinnedProjects }))

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
            command: () => navigate(`/manageProjects/anatomy?project=${projectName}`),
          },
        ],
      )
    }

    return userItems
  }

  const handleEditClick = (e, projectName) => {
    e.stopPropagation()

    navigate(`/manageProjects/anatomy?project=${projectName}`)

    onHide()
  }
  const buildMenuItems = (nodes) => {
    if (!Array.isArray(nodes)) {
      console.warn('buildMenuItems called with:', nodes)
      return []
    }
    
    return nodes.map((node) => {
      // FOLDER
      if (node.data?.isFolder) {
        return {
          id: `folder-${node.data.id}`, // use real folder id
          label: node.label,
          icon: node.icon ?? 'folder',
          children: buildMenuItems(node.subRows ?? []),
        }
      }
      
      // PROJECT
      return {
        id: node.name,
        label: node.name,
        pinned: pinned.includes(node.name),
        node: (
          <ProjectButton
            label={node.name}
            code={node.data?.code}
            highlighted={projectSelected === node.name}
            onClick={() => onProjectSelect(node.name)}
            onPin={(e) => handlePinChange(node.name, e)}
            onContextMenu={(e) => showContext(e, buildContextMenu(node.name))}
            id={node.name}
          />
        ),
      }
    })
  }
  
  const menuItems = useMemo(() => {
    console.log('projectTree', projectTree)
    return buildMenuItems(projectTree)
  }, [projectTree, pinned, projectSelected])

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

    // if projects/[project] is null, projects/[projectName]/defaultTab, else projects/[projectName]/[module]
    const defaultTab = getDefaultTab()
    const pathSegments = location.pathname.split('/')
    const currentModule = pathSegments[3]
    const link = location.pathname.includes('projects')
      ? `/projects/${projectName}/${currentModule || defaultTab}`
      : `/projects/${projectName}/${defaultTab}`

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
