export const mergeAddonWithInstalled = (market, installed = []) => {
  const installedAddon = installed.find((i) => i.name === market.name)
  const marketAddon = {
    ...market,
    isOfficial: market.orgName === 'ynput-official',
    isVerified: false,
  }

  if (!installedAddon) {
    return { ...marketAddon, isInstalled: false, isOutdated: false }
  }

  const isOutdated = !(marketAddon.latestVersions in installedAddon.versions)
  // merge
  const merge = {
    ...marketAddon,
    ...installedAddon,
    versions: marketAddon.versions,
    installedVersions: installedAddon.versions,
    isInstalled: true,
    isOutdated,
  }

  return merge
}

const mergeAddonsData = (market = [], installed = []) => {
  // we want to merge installed in market
  // installed is the source of truth
  // market is the target
  let result = []
  for (let mAddon of market) {
    const merge = mergeAddonWithInstalled(mAddon, installed) || []

    result.push(merge)
  }

  // sort by isInstalled, isOutdated, isOfficial, name
  result?.sort(
    (a, b) =>
      b.isInstalled - a.isInstalled ||
      b.isOutdated - a.isOutdated ||
      b.isOfficial - a.isOfficial ||
      a.name.localeCompare(b.name),
  )

  return result
}

export default mergeAddonsData
