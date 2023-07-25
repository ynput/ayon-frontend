const getLatestSemver = (versionList) => {
  // get the latest semver version from versionList
  // TODO: this is not correct. need to use semver to compare versions
  const latestVersion = versionList.reduce((acc, cur) => {
    return acc > cur ? acc : cur
  })
  return latestVersion
}

export default getLatestSemver
