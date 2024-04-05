import { Button, Icon, Panel } from '@ynput/ayon-react-components'
import * as Styled from './UserAccessGroups.styled'
import { classNames } from 'primereact/utils'
import { Link } from 'react-router-dom'

// access groups panel
const UserAccessGroups = ({ values = {}, selected, onChange }) => {
  const sortedValues = Object.entries(values).sort((a, b) => a[0].localeCompare(b[0]))
  return (
    <Panel>
      <Styled.Header>
        <span>Access Groups</span>
        <Link to={'/settings/accessGroups'}>
          <Button icon="group_add" variant="text" />
        </Link>
      </Styled.Header>
      <Styled.List>
        {sortedValues.map(([accessGroup, projects = []]) => (
          <Styled.AccessGroupItem
            key={accessGroup}
            className={classNames({
              active: !!projects.length,
              selected: selected === accessGroup,
            })}
            onClick={() => onChange(accessGroup)}
          >
            <span className="name">{`${accessGroup} ${
              projects.length ? '- ' + projects.length : ''
            }`}</span>
            <Icon icon={projects.length || selected === accessGroup ? 'chevron_right' : 'add'} />
          </Styled.AccessGroupItem>
        ))}
      </Styled.List>
    </Panel>
  )
}

export default UserAccessGroups
