// get the projects that the user has access to

import { AccessGroups } from '@/helpers/convertAccessGroupsData'

const getUserProjectsAccess = (accessGroups: AccessGroups): string[] => {
  // create a union of all accessGroup keys
  const accessGroupKeys = Object.keys(accessGroups)

  return accessGroupKeys
}

export default getUserProjectsAccess
