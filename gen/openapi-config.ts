import type { ConfigFile } from '@rtk-query/codegen-openapi'
import { permission } from 'process'

// Specify the endpoints you want to generate
const outputFiles = {
  bundles: ['listBundles', 'checkBundleCompatibility', 'migrateSettingsByBundle'],
  folders: ['getFolderHierarchy', 'getFolderList', 'queryTasksFolders'],
  market: ['marketAddonList', 'marketAddonDetail', 'marketAddonVersionDetail', 'getLicenses'],
  watchers: ['getEntityWatchers', 'setEntityWatchers'],
  inbox: ['manageInboxItem'],
  project: ['getProject', 'listProjects', 'getProjectAnatomy', 'getProjectUsers'],
  review: [
    'getReviewablesForVersion',
    'getReviewablesForProduct',
    'getReviewablesForTask',
    'getReviewablesForFolder',
    'sortVersionReviewables',
    'updateReviewable',
    'uploadReviewable',
  ],
  actions: ['listAvailableActionsForContext', 'executeAction', 'configureAction'],
  accessGroups: [
    'getAccessGroupSchema',
    'getAccessGroups',
    'getAccessGroup',
    'deleteAccessGroup',
    'saveAccessGroup',
  ],
  auth: ['createSession', 'getUserPools', 'getSiteInfo'],
  addons: ['listAddons', 'listFrontendModules', 'deleteAddonVersion', 'uploadAddonZipFile'],
  activities: ['deleteProjectActivity'],
  users: ['getUser', 'setFrontendPreferences'],
  releases: ['getReleases', 'getReleaseInfo'],
  installers: ['listInstallers', 'createInstaller', 'deleteInstaller'],
  dependencyPackages: [
    'listDependencyPackages',
    'createDependencyPackage',
    'deleteDependencyPackage',
  ],
  cloud: ['getYnputCloudInfo', 'setYnputCloudKey', 'deleteYnputCloudKey'],
  attributes: ['getAttributeList', 'setAttributeList', 'getAttributeConfig'],
  config: [
    'getServerConfig',
    'getServerOverrides',
    'getServerConfigSchema',
    'setServerConfig',
    'uploadServerConfigFile',
  ],
  services: ['listServices', 'listHosts', 'spawnService', 'patchService', 'deleteService'],
  operations: ['operations'],
  permissions: ['getCurrentUserPermissions', 'getCurrentUserProjectPermissions'],
}

const buildOutputFiles = (files: { [name: string]: string[] }) =>
  Object.entries(files).reduce((acc, [name, endpoints]) => {
    const regexArr = endpoints.map((endpoint) => new RegExp(endpoint, 'i'))
    return {
      ...acc,
      [`../src/api/rest/${name}.ts`]: { filterEndpoints: regexArr },
    }
  }, {})

const config: ConfigFile = {
  schemaFile: `http://localhost:3000/openapi.json`,
  apiFile: '../src/services/ayon.ts',
  exportName: 'api',
  apiImport: 'RestAPI',
  outputFile: '../src/api/rest.ts', // to update global api rest file comment out outputFiles line below
  outputFiles: buildOutputFiles(outputFiles),
  endpointOverrides: [
    {
      pattern: 'checkBundleCompatibility',
      type: 'query',
    },
  ],
}

export default config
