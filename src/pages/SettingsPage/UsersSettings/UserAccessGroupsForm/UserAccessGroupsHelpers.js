import { difference } from 'lodash'

// merge all accessGroups for all users together into one object
export const mergeAccessGroups = (userAccessGroups = {}) => {
  const mergedAccessGroups = {}
  // merge all user accessGroups down into one object
  for (const user in userAccessGroups) {
    const accessGroups = userAccessGroups[user]

    // For each user, iterate over their access groups
    for (const project in accessGroups) {
      const mergedAccessGroupsByProject = mergedAccessGroups[project] || []
      // if project is not in mergedAccessGroups, add it
      if (!mergedAccessGroupsByProject) mergedAccessGroups[project] = []
      //   add accessGroups to mergedAccessGroups, removing duplicates
      mergedAccessGroups[project] = [
        ...new Set([...mergedAccessGroupsByProject, ...accessGroups[project]]),
      ]
    }
  }

  return mergedAccessGroups
}

// mixed values are values that are not the same for all users, for a given project
// { project: [accessGroup]}
export const getMixedValuesByProject = (allValues = {}, currentValue = {}) => {
  const mixedValues = {}
  // check if any of the users do not match mergedAccessGroups by project
  // if so, add it to the mixed fields
  for (const project in allValues) {
    // Get the access groups for the current project
    const projectAccessGroups = allValues[project]

    // Iterate over all users in currentValue
    for (const user in currentValue) {
      // Get the access groups for the current user
      const accessGroups = currentValue[user]

      // Get the access groups for the current user and project, defaulting to an empty array if not found
      const userAccessGroups = accessGroups[project] || []

      // Calculate the difference between the project access groups and the user access groups
      const diff = difference(projectAccessGroups, userAccessGroups)

      // If there is a difference, add it to the mixed values for the current project
      if (diff.length) {
        // If the project doesn't exist in mixedValues, initialize it with an empty array
        if (!mixedValues[project]) mixedValues[project] = []

        // Add the difference to the mixed values for the current project, removing duplicates
        mixedValues[project] = [...new Set([...mixedValues[project], ...diff])]
      }
    }
  }

  return mixedValues
}

// This inverts the object so that the access groups are the keys and the projects are the values
export const groupByAccessGroups = (accessGroups = {}, projects = []) =>
  Object.entries(accessGroups).reduce((acc, [project, accessGroups]) => {
    accessGroups.forEach((ag) => {
      // console.log(projects, project)
      if (!acc[ag]) acc[ag] = []
      // check project is in projectsList
      if (projects.find(({ name }) => name === project)) acc[ag].push(project)
      else {
        // project not found, it must have been deleted
        // we add it anyway so we can remove it from the user
        acc[ag].push(project)
      }
    })
    return acc
  }, {})

export const getProjectsListForSelection = (selected = [], accessGroups = {}, mixedValues = {}) => {
  // calculate selected projects based off selected access groups
  // active project must be selected in every access group across ALL users to be selected
  let activeProjects = []
  //   all projects are all projects in selected in any access group, for any user at least once
  let allProjects = []

  // Use reduce to iterate over the selected array
  selected.forEach((accessGroup) => {
    const projects = accessGroups[accessGroup]

    // If it's the first iteration, return all projects
    // Otherwise, return only the projects that are in both the current and next access group
    activeProjects = activeProjects.length
      ? activeProjects.filter((project) => projects.includes(project))
      : projects

    // add project to all projects if not already there
    allProjects = [...new Set([...allProjects, ...projects])]

    // for each active project, check it is not in mixedValues
    activeProjects = activeProjects.filter((project) => {
      // get mixed access groups for project
      const mixedAccessGroups = mixedValues[project] || []

      // check if selected access groups are in mixed access groups
      return !mixedAccessGroups.includes(accessGroup)
    })
  })

  return { activeProjects, allProjects }
}
