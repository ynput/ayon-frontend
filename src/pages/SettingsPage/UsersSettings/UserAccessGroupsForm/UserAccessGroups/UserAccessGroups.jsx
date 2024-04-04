import { Panel } from '@ynput/ayon-react-components'
import * as Styled from './UserAccessGroups.styled'
import { classNames } from 'primereact/utils'

// access groups panel
const UserAccessGroups = ({ values = {}, selected, onChange }) => {
  const sortedValues = Object.entries(values).sort((a, b) => {
    // First, sort by 'active' status. If 'b' is active and 'a' is not, 'b' should come first.
    if (b[1] && b[1].length > 0 && a[1] && a[1].length === 0) return 1
    if (a[1] && a[1].length > 0 && b[1] && b[1].length === 0) return -1

    // If both 'a' and 'b' have the same 'active' status, sort by key.
    return a[0].localeCompare(b[0])
  })
  return (
    <Panel>
      <Styled.Header>
        <h4>Access Groups</h4>
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
            <span>{`${accessGroup} ${projects.length ? '- ' + projects.length : ''}`}</span>
          </Styled.AccessGroupItem>
        ))}
      </Styled.List>
    </Panel>
  )
}

export default UserAccessGroups
