import { EntityUri, SettingsUri } from '@shared/context'

// helper to parse uri into base and query components
const parseUriComponents = (uri: string): { baseUri: string; queryParams: URLSearchParams } => {
  const parts = uri.split('://')[1].split('?')
  const baseUri = parts[0]
  const query = parts[1]

  return {
    baseUri,
    queryParams: new URLSearchParams(query || ''),
  }
}

// create a uri for an entity path
export const buildEntityUri = ({
  projectName,
  folderPath,
  taskName,
  productName,
  versionName,
}: {
  projectName: string
  folderPath: string
  taskName?: string
  productName?: string
  versionName?: string
}): string => {
  const url = new URL(`ayon+entity://${projectName}/${folderPath}`)
  if (taskName) url.searchParams.append('task', taskName)
  if (productName) url.searchParams.append('product', productName)
  if (versionName) url.searchParams.append('version', versionName)

  return url.toString()
}

export const getSettingsStateFromUri = (uri: string): SettingsUri => {
  const { baseUri, queryParams } = parseUriComponents(uri)

  // extract addon name and version from uri
  // ayon+settings://<addonName>:<addonVersion>/<settingsPathIncludingMoreSlashes>
  const baseUriParts = baseUri.split('/')
  const addonStr = baseUriParts[0]
  const settingsPath = baseUriParts.slice(1)

  const [addonName, addonVersion] = addonStr.split(':')

  // parse query params
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

// extract entity data from a uri
// ayon+entity://wing_it//shots/000_logo/000_0010?task=lighting
export const getEntityStateFromUri = (uri: string): EntityUri => {
  const { baseUri, queryParams } = parseUriComponents(uri)

  // extract project name and folder path from uri
  // ayon+entity://<projectName>/<folderPath>
  const baseUriParts = baseUri.split('/')
  const projectName = baseUriParts[0]
  const folderPath = baseUriParts.slice(1).join('/')

  // parse query params
  const taskName = queryParams.get('task') ?? undefined
  const productName = queryParams.get('product') ?? undefined
  const versionName = queryParams.get('version') ?? undefined

  // determine entity type based on which fields are populated
  let entityType: 'task' | 'folder' | 'product' | 'version'
  if (versionName) {
    entityType = 'version'
  } else if (productName) {
    entityType = 'product'
  } else if (taskName) {
    entityType = 'task'
  } else {
    entityType = 'folder'
  }

  return {
    projectName,
    entityType,
    folderPath,
    taskName,
    productName,
    versionName,
  }
}

// parse a uri and return its type and data
export const parseUri = (
  uri: string,
): {
  type?: 'settings' | 'entity'
  settings?: SettingsUri
  entity?: EntityUri
} => {
  if (!uri) {
    return { type: undefined }
  }

  // check if it's a settings or entity uri
  if (uri.startsWith('ayon+settings://')) {
    return {
      type: 'settings',
      settings: getSettingsStateFromUri(uri),
    }
  } else if (uri.startsWith('ayon+entity://')) {
    return {
      type: 'entity',
      entity: getEntityStateFromUri(uri),
    }
  } else {
    return { type: undefined }
  }
}
