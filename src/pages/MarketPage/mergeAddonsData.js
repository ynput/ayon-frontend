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

  // merge
  const merge = {
    ...installedAddon,
    ...marketAddon,
    versions: marketAddon.versions,
    installedVersions: installedAddon.versions,
  }

  return merge
}
