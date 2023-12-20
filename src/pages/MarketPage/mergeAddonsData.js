const mergeAddonsData = (market = [], installed = []) => {
  // we want to merge installed in market
  // installed is the source of truth
  // market is the target
  let result = []
  for (const marketAddon of market) {
    const installedAddon = installed.find((i) => i.name === marketAddon.name)
    if (!installedAddon) {
      result.push({ ...marketAddon, isInstalled: false, isOutdated: false })
      continue
    }

    const isOutdated = !(marketAddon.latestVersions in installedAddon.versions)
    // merge
    const merged = {
      ...marketAddon,
      ...installedAddon,
      isInstalled: true,
      isOutdated,
    }
    result.push(merged)
  }

  return result
}

export default mergeAddonsData
