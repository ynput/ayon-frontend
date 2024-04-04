import { useState } from 'react'
import styled from 'styled-components'
import UserAccessGroups from './UserAccessGroups/UserAccessGroups'
import UserAccessGroupsProjects from './UserAccessGroupsProjects/UserAccessGroupsProjects'

const ContainerStyled = styled.div`
  display: flex;
  gap: 4px;
  overflow: hidden;

  & > * {
    flex: 1;
  }
`

const UserAccessGroupsForm = ({ value = {}, options = [], projectsList = [], onChange }) => {
  // value = { projectName: [accessGroup1, accessGroup2]}
  // options = [{ name: projectName }]

  // reduce value down to be grouped by access group with projects as values
  const accessGroups = Object.entries(value).reduce((acc, [project, accessGroups]) => {
    accessGroups.forEach((ag) => {
      if (!acc[ag]) acc[ag] = []
      acc[ag].push(project)
    })
    return acc
  }, {})

  //   now merge in any access groups that are not in accessGroups with empty array
  options.forEach(({ name }) => {
    if (!accessGroups[name]) accessGroups[name] = []
  })

  const [selectedAccessGroup, setSelectedAccessGroup] = useState(null)

  const handleAccessChange = (project) => {
    // get current access groups for project
    // note: if project is not in value, it will default to empty array
    const newProjectAccessGroups = value[project] || []

    // update access groups for project
    // add or remove access group from project
    if (newProjectAccessGroups.includes(selectedAccessGroup)) {
      // remove access group from project
      newProjectAccessGroups.splice(newProjectAccessGroups.indexOf(selectedAccessGroup), 1)
    } else {
      // add access group to project
      newProjectAccessGroups.push(selectedAccessGroup)
    }

    const newAccessGroups = {
      ...value,
      [project]: newProjectAccessGroups,
    }

    onChange && onChange(newAccessGroups)
  }

  return (
    <ContainerStyled>
      <UserAccessGroups
        values={accessGroups}
        selected={selectedAccessGroup}
        onChange={setSelectedAccessGroup}
      />
      <UserAccessGroupsProjects
        values={accessGroups[selectedAccessGroup]}
        options={projectsList}
        onChange={handleAccessChange}
        isDisabled={!selectedAccessGroup}
      />
    </ContainerStyled>
  )
}

export default UserAccessGroupsForm
