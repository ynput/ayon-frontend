import * as Styled from './projectMenu.styled'
import { useDispatch, useSelector } from 'react-redux'
import {
  useGetProjectFoldersQuery,
  useListProjectsQuery,
  useSetFrontendPreferencesMutation,
} from '@shared/api'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { InputText, Section } from '@ynput/ayon-react-components'
import { useLocalStorage } from '@shared/hooks'
import { createPortal } from 'react-dom'
import { useShortcutsContext } from '@context/ShortcutsContext'
import { useProjectSelectDispatcher } from './hooks/useProjectSelectDispatcher'
import { updateUserPreferences as updateUserPreferencesAction } from '@state/user'
import { useProjectDefaultTab } from '@hooks/useProjectDefaultTab'
import { useLocation, useNavigate } from 'react-router-dom'
import buildProjectsTableData, { parseProjectFolderRowId } from '@containers/ProjectsList/buildProjectsTableData'
import { usePowerpack } from '@shared/context'
import ProjectsTable from '@containers/ProjectsList/ProjectsTable'

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
  }, [isOpen, setAllowed])

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
  const { powerLicense } = usePowerpack()

  const { data: projects = [] } = useListProjectsQuery({ active: true })
  const { data: folders = [] } = useGetProjectFoldersQuery({active: true})
  const projectTree = useMemo(
    () => buildProjectsTableData(projects, folders, true, powerLicense),
    [projects, folders, powerLicense],
  )
  const [handleProjectSelectionDispatches] = useProjectSelectDispatcher([])
  const { getDefaultTab } = useProjectDefaultTab()

  // Auto-expand all folders in the tree
  const autoExpandedState = useMemo(() => {
    const expandAll = (nodes) => {
      const expanded = {}
      nodes.forEach((node) => {
        if (node.data?.isFolder) {
          expanded[node.id] = true
          if (node.subRows && node.subRows.length > 0) {
            Object.assign(expanded, expandAll(node.subRows))
          }
        }
      })
      return expanded
    }
    return expandAll(projectTree)
  }, [projectTree])

  // Table state for readonly table
  const [expanded, setExpanded] = useState({})

  const rowSelection = useMemo(
    () => ({ [projectSelected]: true }),
    [projectSelected],
  )

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

  // Filter projects by search and track which folders should be expanded
  const { filteredProjectTree, foldersToExpand } = useMemo(() => {
    if (!search) return { filteredProjectTree: projectTree, foldersToExpand: new Set() }

    const foldersToExpand = new Set()

    const filterNodes = (nodes) => {
      return nodes.reduce((acc, node) => {
        if (node.data?.isFolder) {
          const filteredChildren = filterNodes(node.subRows || [])
          if (filteredChildren.length > 0) {
            // Mark this folder for expansion since it has matching children
            foldersToExpand.add(node.id)
            acc.push({ ...node, subRows: filteredChildren })
          }
        } else if (node.name?.toLowerCase().includes(search.toLowerCase())) {
          acc.push(node)
        }
        return acc
      }, [])
    }

    return {
      filteredProjectTree: filterNodes(projectTree),
      foldersToExpand
    }
  }, [projectTree, search])

  // Update expanded state when search results change
  useEffect(() => {
    if (search && foldersToExpand.size > 0) {
      const expandedState = {}
      foldersToExpand.forEach(folderId => {
        expandedState[folderId] = true
      })
      setExpanded(prev => {
        // Only update if keys are different
        const prevKeys = Object.keys(prev).sort().join(',')
        const newKeys = Object.keys(expandedState).sort().join(',')
        return prevKeys !== newKeys ? expandedState : prev
      })
    } else if (!search) {
      // When not searching, auto-expand all folders
      setExpanded(prev => {
        // Only update if keys are different
        const prevKeys = Object.keys(prev).sort().join(',')
        const newKeys = Object.keys(autoExpandedState).sort().join(',')
        return prevKeys !== newKeys ? autoExpandedState : prev
      })
    }
  }, [search, foldersToExpand, autoExpandedState])

  const handleHide = useCallback(() => {
    onHide()
    // close search if it was open
    setSearchOpen(false)
    // clear search
    setSearch('')
  }, [onHide])

  const onProjectSelect = useCallback((projectName) => {
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
  }, [handleHide, handleProjectSelectionDispatches, getDefaultTab, location.pathname, navigate])

  const handleRowSelectionChange = (newSelection) => {
    const selectedIds = Object.keys(newSelection).filter((id) => newSelection[id])
    if (selectedIds.length > 0) {
      const selectedId = selectedIds[0]
      // Check if the selected item is a folder - if so, don't navigate
      const isFolder = parseProjectFolderRowId(selectedId)
      if (!isFolder) {
        onProjectSelect(selectedId)
      }
    }
  }

  const handleSearchClick = (e) => {
    e.stopPropagation()
    setSearchOpen(true)
  }
  const focusElement = useCallback((element) => {
    if (element) {
      element.focus()
    }
  }, [])

  const getSibling = useCallback((element, direction) => {
    const sibling =
      direction === 'next' ? element.nextElementSibling : element.previousElementSibling
    return sibling?.tagName === 'HR' ? getSibling(sibling, direction) : sibling
  }, [])

  const handleArrowKeys = useCallback((e) => {
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
        const edgeItem = menuRef.current?.getElement()?.querySelector(`.project-item`)
        focusElement(edgeItem)
      }
    }
  }, [getSibling, focusElement])

  // if we start typing, open the search automatically
  const handleKeyPress = useCallback((e) => {
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
      } else if (searchOpen && search.length > 0 && filteredProjectTree.length > 0) {
        // select top result
        const topResult = filteredProjectTree[0]
        if (topResult && !topResult.data?.isFolder) {
          onProjectSelect(topResult.name)
        }
      }
    } else if (e.key === 'Backspace') {
      if (searchOpen && search.length > 0) {
        // focus on search input
        focusElement(searchRef.current)
      }
    } else handleArrowKeys(e)
  }, [searchOpen, search, filteredProjectTree, handleHide, onProjectSelect, handleArrowKeys])
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
            <ProjectsTable
              data={filteredProjectTree}
              isLoading={false}
              rowSelection={rowSelection}
              onRowSelectionChange={handleRowSelectionChange}
              rowPinning={pinned}
              expanded={expanded}
              setExpanded={setExpanded}
              multiSelect={false}
              readonly={true}
              selection={projectSelected ? [projectSelected] : []}
              containerClassName="menu-list"
            />
          </Styled.All>
        </Section>
      </Styled.ProjectSidebar>
    </>
  )
}

export default ProjectMenu
