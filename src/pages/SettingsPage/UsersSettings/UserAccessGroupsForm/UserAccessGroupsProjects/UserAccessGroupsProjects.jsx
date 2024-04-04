import { Button, Icon, Panel } from '@ynput/ayon-react-components'
import * as Styled from './UserAccessGroupsProjects.styled'
import { classNames } from 'primereact/utils'

// access groups panel
const UserAccessGroupsProjects = ({ values = [], options = [], onChange, isDisabled }) => {
  // sort options alphabetically
  const sortedOptions = [...options].sort((a, b) => a.name.localeCompare(b.name))

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
    <Panel>
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
            className={classNames({ active: values.includes(name), disabled: isDisabled })}
            onClick={() => onChange([name])}
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
