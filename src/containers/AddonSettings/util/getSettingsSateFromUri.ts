const getSettingsStateFromUri = (
  uri: string,
): {
  addonName: string
  addonVersion: string
  settingsPath: string[]
  site: string | undefined
  project: string | undefined
} => {
  // split query params
  const parts = uri.split('://')[1].split('?')
  const baseUri = parts[0]
  const query = parts[1]

  // extract addon name and version from uri
  // ayon+settings://<addonName>:<addonVersion>/<settingsPathIncludingMoreSlashes>
  const baseUriParts = baseUri.split('/')
  const addonStr = baseUriParts[0]
  const settingsPath = baseUriParts.slice(1)

  const [addonName, addonVersion] = addonStr.split(':')

  // parse query params
  const queryParams = new URLSearchParams(query || '')
  const site = queryParams.get('site') ?? undefined
  const project = queryParams.get('project') ?? undefined

  return {
    addonName,
    addonVersion,
    settingsPath,
    site,
    project,
  }
}

export default getSettingsStateFromUri
