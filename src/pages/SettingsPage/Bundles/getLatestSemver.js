import { compareBuild } from 'semver'

const getLatestSemver = (versionList = []) => {
  if (!versionList.length) return
  // sort the version list by semver, with the latest version first
  const sortedVersions = versionList.sort((a, b) => -1 * compareBuild(a, b))
  // return the latest version
  return sortedVersions[0]
}

export default getLatestSemver
