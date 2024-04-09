import { Button, Icon, Panel } from '@ynput/ayon-react-components'
import * as Styled from './UserAccessGroups.styled'
import { classNames } from 'primereact/utils'
import { Link } from 'react-router-dom'

// access groups panel
const UserAccessGroups = ({ values = {}, selected = [], onChange, disableNewGroup = false }) => {
  const sortedValues = Object.entries(values).sort((a, b) => a[0].localeCompare(b[0]))

  const handleAccessGroupClick = (e) => {
    // if shift, ctrl or meta key is pressed, add to selection
    // otherwise, replace selection
    // accessGroup is the id of the clicked element
    const { id } = e.currentTarget
    let newSelected = []

    if (e.shiftKey) {
      const lastSelected = selected[selected.length - 1]
      const lastIndex = sortedValues.findIndex(([accessGroup]) => accessGroup === lastSelected)
      const currentIndex = sortedValues.findIndex(([accessGroup]) => accessGroup === id)

      if (lastIndex < currentIndex) {
        newSelected = sortedValues
          .slice(lastIndex, currentIndex + 1)
          .map(([accessGroup]) => accessGroup)
      } else {
        newSelected = sortedValues
          .slice(currentIndex, lastIndex + 1)
          .map(([accessGroup]) => accessGroup)
      }
    }

    if (e.ctrlKey || e.metaKey) {
      newSelected = selected.includes(id)
        ? selected.filter((accessGroup) => accessGroup !== id)
        : [...selected, id]
    }

    if (!newSelected.length) {
      newSelected = [id]
    }

    onChange(newSelected)
  }

  return (
    <Panel>
      <Styled.Header>
        <span>Access Groups</span>
        <Link
          to={disableNewGroup ? '' : '/settings/accessGroups'}
          style={{
            opacity: disableNewGroup ? 0 : 1,
            pointerEvents: disableNewGroup ? 'none' : 'auto',
          }}
        >
          <Button icon="group_add" variant="text" />
        </Link>
      </Styled.Header>
      <Styled.List>
        {sortedValues.map(([accessGroup, projects = []]) => (
          <Styled.AccessGroupItem
            key={accessGroup}
            className={classNames({
              active: !!projects.length,
              selected: selected.includes(accessGroup),
            })}
            onClick={handleAccessGroupClick}
            id={accessGroup}
          >
            <span className="name">{`${accessGroup} ${'- ' + projects.length}`}</span>
            <Icon icon={'chevron_right'} />
          </Styled.AccessGroupItem>
        ))}
      </Styled.List>
    </Panel>
  )
}

export default UserAccessGroups
