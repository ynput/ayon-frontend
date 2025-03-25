export const mergeAddonWithDownloaded = (market, downloaded = []) => {
  const downloadedAddon = downloaded.find((i) => i.name === market.name)
  const marketAddon = {
    ...market,
    isOfficial: market.orgName === 'ynput-official',
    isVerified: false,
  }

  if (!downloadedAddon) {
    return { ...marketAddon, isDownloaded: false, isOutdated: false }
  }

  // merge
  const merge = {
    ...downloadedAddon,
    ...marketAddon,
    versions: marketAddon.versions,
    downloadedVersions: downloadedAddon.versions,
  }

  return merge
}
