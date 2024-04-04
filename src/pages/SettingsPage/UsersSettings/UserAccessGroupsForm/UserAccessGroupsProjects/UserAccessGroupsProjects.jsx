import { Icon, Panel } from '@ynput/ayon-react-components'
import * as Styled from './UserAccessGroupsProjects.styled'
import { classNames } from 'primereact/utils'

// access groups panel
const UserAccessGroupsProjects = ({ values = [], options = [], onChange, isDisabled }) => {
  // sort options alphabetically
  const sortedOptions = [...options].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <Panel>
      <Styled.Header>
        <h4>Projects</h4>
      </Styled.Header>
      <Styled.List>
        {sortedOptions.map(({ name }) => (
          <Styled.ProjectItem
            key={name}
            className={classNames({ active: values.includes(name), disabled: isDisabled })}
            onClick={() => onChange(name)}
          >
            <span>{name}</span>
            {!isDisabled && <Icon icon={values.includes(name) ? 'check' : 'add'} />}
          </Styled.ProjectItem>
        ))}
      </Styled.List>
    </Panel>
  )
}

export default UserAccessGroupsProjects
