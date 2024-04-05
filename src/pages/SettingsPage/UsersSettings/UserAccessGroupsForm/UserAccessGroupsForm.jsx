import { useState } from 'react'
import styled from 'styled-components'
import UserAccessGroups from './UserAccessGroups/UserAccessGroups'
import UserAccessGroupsProjects from './UserAccessGroupsProjects/UserAccessGroupsProjects'

const ContainerStyled = styled.div`
  display: flex;
  gap: 4px;
  overflow: hidden;
  min-height: 300px;

  & > * {
    flex: 1;
    overflow: hidden;
  }
`

const UserAccessGroupsForm = ({ value = {}, options = [], projectsList = [], onChange }) => {
  // value = { projectName: [accessGroup1, accessGroup2]}
  // options = [{ name: projectName }]

  // reduce value down to be grouped by access group with projects as values
  const accessGroups = Object.entries(value).reduce((acc, [project, accessGroups]) => {
    accessGroups.forEach((ag) => {
      if (!acc[ag]) acc[ag] = []
      // check project is in projectsList
      if (projectsList.find(({ name }) => name === project)) acc[ag].push(project)
    })
    return acc
  }, {})

  //   now merge in any access groups that are not in accessGroups with empty array
  options.forEach(({ name }) => {
    if (!accessGroups[name]) accessGroups[name] = []
  })

  const [selectedAccessGroups, setSelectedAccessGroups] = useState([])

  const handleAccessChange = (projects, activeProjects) => {
    const newAccessGroups = {
      ...value,
    }

    projects.forEach((project) => {
      // get current access groups for project
      // note: if project is not in value, it will default to empty array
      // spread the array to create a new array and avoid mutating the original
      const newProjectAccessGroups = [...(value[project] || [])]

      for (const accessGroup of selectedAccessGroups) {
        // is this accessGroup inactive for any of the selected projects?
        const notActiveForAll = !activeProjects.includes(project)

        if (notActiveForAll) {
          // this project is not active on all selected access groups
          // so we set it active for all selected access groups (even if it was already active)
          if (!newProjectAccessGroups.includes(accessGroup))
            newProjectAccessGroups.push(accessGroup)
        } else {
          // otherwise we toggle the access group for the project

          // update access groups for project
          // add or remove access group from project
          if (newProjectAccessGroups.includes(accessGroup)) {
            // remove access group from project
            newProjectAccessGroups.splice(newProjectAccessGroups.indexOf(accessGroup), 1)
          } else {
            // add access group to project
            newProjectAccessGroups.push(accessGroup)
          }
        }
      }

      // update access groups for project
      newAccessGroups[project] = newProjectAccessGroups
    })

    onChange && onChange(newAccessGroups)
  }

  // calculate selected projects based off selected access groups
  // a project must be selected in every access group to be selected
  let activeProjects = [],
    allProjects = []
  for (const accessGroup of selectedAccessGroups) {
    const projects = accessGroups[accessGroup]
    if (!activeProjects.length) {
      activeProjects.push(...projects)
    } else {
      activeProjects = activeProjects.filter((project) => projects.includes(project))
    }

    // add project to all projects if not already there
    allProjects.push(...projects)
  }

  return (
    <ContainerStyled id="user-access-groups-form">
      <UserAccessGroups
        values={accessGroups}
        selected={selectedAccessGroups}
        onChange={setSelectedAccessGroups}
      />
      <UserAccessGroupsProjects
        values={allProjects}
        activeValues={activeProjects}
        options={projectsList}
        onChange={(p) => handleAccessChange(p, activeProjects)}
        isDisabled={!selectedAccessGroups.length}
      />
    </ContainerStyled>
  )
}

export default UserAccessGroupsForm
