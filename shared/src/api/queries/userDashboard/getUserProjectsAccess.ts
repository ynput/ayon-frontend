// get the projects that the user has access to

import { AccessGroups } from './convertAccessGroupsData'

const getUserProjectsAccess = (accessGroups: AccessGroups): string[] => {
  // create a union of all accessGroup keys
  const accessGroupKeys = Object.keys(accessGroups)

  return accessGroupKeys
}

export default getUserProjectsAccess
