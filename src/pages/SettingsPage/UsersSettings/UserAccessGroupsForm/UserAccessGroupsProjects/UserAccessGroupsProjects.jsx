import { Button, Icon, InputText, Panel } from '@ynput/ayon-react-components'
import * as Styled from './UserAccessGroupsProjects.styled'
import { classNames } from 'primereact/utils'
import { useRef, useState } from 'react'
import { matchSorter } from 'match-sorter'

// access groups panel
const UserAccessGroupsProjects = ({
  values = [],
  activeValues = [],
  options = [],
  onChange,
  isDisabled,
}) => {
  // sort options alphabetically
  const sortedOptions = [...options].sort((a, b) => a.name.localeCompare(b.name))

  const isDragging = useRef(false)

  // is the search bar open?
  const [searchOpen, setSearchOpen] = useState(false)
  // search string
  const [search, setSearch] = useState('')

  // if search open, filter options
  const filteredOptions = matchSorter(sortedOptions, search, { keys: ['name'] })

  // if search is open, use filtered options, otherwise use sorted options
  const projectOptions = searchOpen ? filteredOptions : sortedOptions

  // this keeps track of which projects the mouse is over, to prevent triggering the same project multiple times
  const [currentHoveredIndex, setCurrentHoveredIndex] = useState(null)
  // are we turning on or off
  const [turningOn, setTurningOn] = useState(true)

  const handleItemMouseDown = (e) => {
    isDragging.current = true

    const itemElement = e.target.closest('.project-item')

    if (!itemElement) return

    // get the id of the item the mouse is over
    const projectId = itemElement.id
    // get index of the item the mouse is over
    const index = sortedOptions.findIndex(({ name }) => name === projectId)

    setCurrentHoveredIndex(index)

    // if the project is already in the list, we are turning it off
    setTurningOn(!values.includes(projectId))

    // change the value of the project
    onChange([projectId])
  }

  const handleMouseUp = () => {
    isDragging.current = false
    setCurrentHoveredIndex(null)
  }

  const handleMouseMove = (e) => {
    if (!isDragging.current) return

    // return is class name is not project-item
    if (!e.target.className.includes('project-item')) return

    // get id of the item the mouse is over
    const projectId = e.target.id
    // get index of the item the mouse is over
    const index = sortedOptions.findIndex(({ name }) => name === projectId)

    // check if the id is already in the list
    if (currentHoveredIndex === index) return

    const projectIdsToChange = []
    // check if the project is the opposite of what we are turning on
    if (values.includes(projectId) !== turningOn) {
      // otherwise we are turning it to turningOn (toggling it)
      projectIdsToChange.push(projectId)
    }

    onChange(projectIdsToChange)

    // set new index
    setCurrentHoveredIndex(index)
  }

  // keyboard selection on item
  const handleItemKeyDown = (e) => {
    // onChange the project using id if enter or space
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleItemMouseDown(e)
    }
  }

  const handleSearchClose = () => {
    setSearchOpen(false)
    setSearch('')
  }

  // search keyboard selection
  const handleSearchKeyDown = (e) => {
    if (!searchOpen) return

    // if escape, close search
    if (e.key === 'Escape') {
      e.preventDefault()
      handleSearchClose()
    }

    // if enter, focus on the first project
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()

      // select the first project
      const firstProject = e.target
        .closest('#user-access-groups-projects')
        ?.querySelector('.project-item')
      // focus on the first project
      if (firstProject) firstProject.focus()

      // only one project from search? select it
      if (filteredOptions.length === 1) {
        onChange([filteredOptions[0].name])
      }
    }
  }

  const handleKeyDown = (e) => {
    // if esc and search is open, close search
    if (e.key === 'Escape' && searchOpen) {
      e.preventDefault()
      handleSearchClose()
    }
  }

  const handleSelectAll = () => {
    // onChange only the names of the projects that are not already in values
    const addingValues = sortedOptions
      .map(({ name }) => name)
      .filter((name) => !values.includes(name))

    if (addingValues.length === 0) return

    onChange(addingValues)
  }

  const handleClearAll = () => {
    // onChange only the names of the projects that are in values
    const removingValues = sortedOptions
      .map(({ name }) => name)
      .filter((name) => values.includes(name))

    if (removingValues.length === 0) return

    onChange(removingValues)
  }

  const allEnabled =
    !sortedOptions.length || sortedOptions.every(({ name }) => values.includes(name))

  const noneEnabled = !!values.length

  return (
    <Panel
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onKeyDown={handleKeyDown}
      id="user-access-groups-projects"
    >
      <Styled.Header
        onClick={() => !searchOpen && setSearchOpen(true)}
        className={classNames({ searchOpen, disabled: isDisabled })}
      >
        {searchOpen ? (
          <>
            <InputText
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              placeholder="Search projects..."
              onKeyDown={handleSearchKeyDown}
            />
            <Styled.CloseIcon icon={searchOpen ? 'close' : 'search'} onClick={handleSearchClose} />
          </>
        ) : (
          <>
            <span>Projects</span>
            <Button
              icon={searchOpen ? 'close' : 'search'}
              variant="text"
              onClick={() => setSearchOpen(true)}
            />
          </>
        )}
      </Styled.Header>
      <Styled.Buttons>
        {noneEnabled && (
          <Button onClick={handleClearAll} disabled={!noneEnabled || isDisabled}>
            Clear all
          </Button>
        )}
        <Button onClick={handleSelectAll} disabled={allEnabled || isDisabled}>
          {allEnabled ? 'All selected' : noneEnabled ? 'Select all' : 'Select all projects'}
        </Button>
      </Styled.Buttons>
      <Styled.List>
        {projectOptions.map(({ name }) => (
          <Styled.ProjectItem
            key={name}
            className={classNames('project-item', {
              active: values.includes(name),
              disabled: isDisabled,
              dragging: isDragging.current,
            })}
            onMouseDown={handleItemMouseDown}
            onKeyDown={handleItemKeyDown}
            id={name}
            tabIndex={0}
          >
            <span className="name">{name}</span>
            <Icon
              icon={
                values.includes(name) ? (activeValues.includes(name) ? 'check' : 'remove') : 'add'
              }
            />
          </Styled.ProjectItem>
        ))}
      </Styled.List>
    </Panel>
  )
}

export default UserAccessGroupsProjects
