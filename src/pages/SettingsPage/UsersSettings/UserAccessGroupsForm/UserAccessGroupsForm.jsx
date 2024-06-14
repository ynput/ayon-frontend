import { useState } from 'react'
import styled from 'styled-components'
import UserAccessGroups from './UserAccessGroups/UserAccessGroups'
import UserAccessGroupsProjects from './UserAccessGroupsProjects/UserAccessGroupsProjects'
import { useListProjectsQuery } from '/src/services/project/getProject'
import {
  getMixedValuesByProject,
  getProjectsListForSelection,
  groupByAccessGroups,
  mergeAccessGroups,
} from './UserAccessGroupsHelpers'

const ContainerStyled = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  overflow: hidden;
  min-height: 300px;

  & > * {
    flex: 1;
    overflow: hidden;
  }
`

// value is an object with user ids as keys and access groups as values
// { userId: { project: [accessGroup] } }
// options is an array of access groups
// { name: projectName}
// onChange is a function that returns the new value for all users
// { userId: { project: [accessGroup] }

const UserAccessGroupsForm = ({ value = {}, options = [], onChange, disableNewGroup }) => {
  const { data: projectsList = [] } = useListProjectsQuery({ active: true })

  // merge all accessGroups for all users together into one object
  const mergedAccessGroupsProjects = mergeAccessGroups(value)

  // mixed values are values that are not the same for all users, for a given project
  // { project: [mixedAccessGroup]}
  // We use this to show a "-" icon next to projects that are not the same for all users
  const mixedValues = getMixedValuesByProject(mergedAccessGroupsProjects, value)

  // reduce value down to be grouped by access group with projects as values
  const accessGroups = groupByAccessGroups(mergedAccessGroupsProjects, projectsList)

  //   now merge in any access groups that are not in accessGroups with empty array
  options.forEach(({ name }) => {
    if (!accessGroups[name]) accessGroups[name] = []
  })

  // the access groups the user has selected in the UI
  const [selectedAccessGroups, setSelectedAccessGroups] = useState([])

  // calculate selected projects based off selected access groups
  // a project must be selected in every access group across ALL users to be selected
  // values that are mixed show "-" icon.
  const { allProjects, activeProjects } = getProjectsListForSelection(
    selectedAccessGroups,
    accessGroups,
    mixedValues,
  )

  const handleAccessChange = (projects, activeProjects) => {
    const newUsersAccessGroups = {
      ...value,
    }

    // for each user, update the access groups for the selected access groups
    for (const user in value) {
      const accessGroups = value[user] || {}

      const newAccessGroups = {
        ...accessGroups,
      }

      projects.forEach((project) => {
        // get current access groups for project
        // if project is not in value, it will default to empty array
        // spread the array to create a new array and avoid mutating the original
        const newProjectAccessGroups = [...(accessGroups[project] || [])]

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

      // finally update the user access groups
      newUsersAccessGroups[user] = newAccessGroups
    }

    onChange && onChange(newUsersAccessGroups)
  }

  // for each user access group, add all projects to allProjects

  return (
    <ContainerStyled id="user-access-groups-form">
      <UserAccessGroups
        values={accessGroups}
        selected={selectedAccessGroups}
        onChange={setSelectedAccessGroups}
        disableNewGroup={disableNewGroup}
      />
      <UserAccessGroupsProjects
        values={allProjects}
        activeValues={activeProjects}
        selectedAG={selectedAccessGroups}
        options={projectsList}
        onChange={(p, clearAll) => handleAccessChange(p, activeProjects, clearAll)}
        isDisabled={!selectedAccessGroups.length}
      />
    </ContainerStyled>
  )
}

export default UserAccessGroupsForm
