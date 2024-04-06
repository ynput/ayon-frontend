import { useState } from 'react'
import styled from 'styled-components'
import UserAccessGroups from './UserAccessGroups/UserAccessGroups'
import UserAccessGroupsProjects from './UserAccessGroupsProjects/UserAccessGroupsProjects'
import { useGetAllProjectsQuery } from '/src/services/project/getProject'
import { difference } from 'lodash'

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

// value is an object with user ids as keys and access groups as values
// { userId: { project: [accessGroup] } }
// options is an array of access groups
// { name: projectName}
// onChange is a function that returns the new value for all users
// { userId: { project: [accessGroup] }

const UserAccessGroupsForm = ({ value = {}, options = [], onChange, disableNewGroup }) => {
  const { data: projectsList = [] } = useGetAllProjectsQuery({ showInactive: false })

  const mergedAccessGroups = {}
  // merge all user accessGroups down into one object
  for (const user in value) {
    const accessGroups = value[user]
    for (const project in accessGroups) {
      if (!mergedAccessGroups[project]) mergedAccessGroups[project] = []
      mergedAccessGroups[project] = [
        ...new Set([...mergedAccessGroups[project], ...accessGroups[project]]),
      ]
    }
  }

  // mixed values are values that are not the same for all users, for a given project
  // { project: [accessGroup]}
  const mixedValues = {}
  // check if any of the users do not match mergedAccessGroups by project
  // if so, add it to the mixed fields
  for (const project in mergedAccessGroups) {
    const projectAccessGroups = mergedAccessGroups[project]
    for (const user in value) {
      const accessGroups = value[user]
      const userAccessGroups = accessGroups[project] || []
      const diff = difference(projectAccessGroups, userAccessGroups)
      if (diff.length) {
        if (!mixedValues[project]) mixedValues[project] = []
        mixedValues[project] = [...new Set([...mixedValues[project], ...diff])]
      }
    }
  }

  // reduce value down to be grouped by access group with projects as values
  const accessGroups = Object.entries(mergedAccessGroups).reduce((acc, [project, accessGroups]) => {
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

  // calculate selected projects based off selected access groups
  // a project must be selected in every access group across ALL users to be selected
  // values that are mixed show "-" icon.
  let activeProjects = [],
    allProjects = []
  for (const accessGroup of selectedAccessGroups) {
    const projects = accessGroups[accessGroup]

    if (!activeProjects.length) {
      // first access group, fill active projects with all projects
      activeProjects.push(...projects)
    } else {
      activeProjects = activeProjects.filter((project) => projects.includes(project))
    }

    // add project to all projects if not already there
    allProjects.push(...projects)
  }

  // for each active project, check it is not in mixedValues
  for (const project of allProjects) {
    // get mixed access groups for project
    const mixedAccessGroups = mixedValues[project] || []

    // check if selected access groups are in mixed access groups
    for (const accessGroup of selectedAccessGroups) {
      if (mixedAccessGroups.includes(accessGroup)) {
        // remove project from active projects
        activeProjects = activeProjects.filter((item) => item !== project)
      }
    }
  }

  const handleAccessChange = (projects, activeProjects, clearAll) => {
    const newUsersAccessGroups = {
      ...value,
    }

    for (const user in value) {
      const accessGroups = value[user] || {}

      const newAccessGroups = {
        ...accessGroups,
      }

      if (clearAll) {
        // clear all selected access groups for projects
        for (const accessGroup of selectedAccessGroups) {
          for (const { name: project } of projectsList) {
            if (newAccessGroups[project]?.includes(accessGroup)) {
              console.log(project, accessGroup)
              newAccessGroups[project] = newAccessGroups[project].filter((ag) => ag !== accessGroup)
            }
          }
        }
      }

      projects.forEach((project) => {
        // get current access groups for project
        // note: if project is not in value, it will default to empty array
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
        options={projectsList}
        onChange={(p, clearAll) => handleAccessChange(p, activeProjects, clearAll)}
        isDisabled={!selectedAccessGroups.length}
      />
    </ContainerStyled>
  )
}

export default UserAccessGroupsForm
