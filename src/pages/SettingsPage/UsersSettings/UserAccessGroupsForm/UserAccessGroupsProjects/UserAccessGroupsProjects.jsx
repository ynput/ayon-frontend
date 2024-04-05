import { Button, Icon, Panel } from '@ynput/ayon-react-components'
import * as Styled from './UserAccessGroupsProjects.styled'
import { classNames } from 'primereact/utils'
import { useRef, useState } from 'react'

// access groups panel
const UserAccessGroupsProjects = ({ values = [], options = [], onChange, isDisabled }) => {
  // sort options alphabetically
  const sortedOptions = [...options].sort((a, b) => a.name.localeCompare(b.name))

  const isDragging = useRef(false)

  // this keeps track of which projects the mouse is over, to prevent triggering the same project multiple times
  const [currentHoveredIndex, setCurrentHoveredIndex] = useState(null)
  // are we turning on or off
  const [turningOn, setTurningOn] = useState(true)

  const handleMouseDown = (e) => {
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
    <Panel onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
      <Styled.Buttons>
        {noneEnabled && (
          <Button onClick={handleClearAll} disabled={!noneEnabled}>
            Clear all
          </Button>
        )}
        <Button onClick={handleSelectAll} disabled={allEnabled}>
          {allEnabled ? 'All selected' : noneEnabled ? 'Select all' : 'Select all projects'}
        </Button>
      </Styled.Buttons>
      <Styled.List>
        {sortedOptions.map(({ name }) => (
          <Styled.ProjectItem
            key={name}
            className={classNames('project-item', {
              active: values.includes(name),
              disabled: isDisabled,
              dragging: isDragging.current,
            })}
            onClick={() => onChange([name])}
            onMouseDown={handleMouseDown}
            id={name}
          >
            <span className="name">{name}</span>
            <Icon icon={values.includes(name) ? 'check' : 'add'} />
          </Styled.ProjectItem>
        ))}
      </Styled.List>
    </Panel>
  )
}

export default UserAccessGroupsProjects
