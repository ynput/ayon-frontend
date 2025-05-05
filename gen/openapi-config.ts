import type { ConfigFile } from '@rtk-query/codegen-openapi'

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
  auth: ['createSession', 'getUserPools', 'getSiteInfo', 'getCurrentUser'],
  addons: ['listAddons', 'deleteAddonVersion', 'uploadAddonZipFile'],
  modules: ['listFrontendModules'],
  activities: [
    'deleteProjectActivity',
    'createReactionToActivity',
    'deleteReactionToActivity',
    'suggestEntityMention',
  ],
  users: ['getUser', 'setFrontendPreferences'],
  releases: ['getReleases', 'getReleaseInfo'],
  installers: ['listInstallers', 'createInstaller', 'deleteInstaller'],
  dependencyPackages: [
    'listDependencyPackages',
    'createDependencyPackage',
    'deleteDependencyPackage',
  ],
  cloud: [
    'getYnputCloudInfo',
    'setYnputCloudKey',
    'deleteYnputCloudKey',
    'getFeedbackVerification',
  ],
  attributes: ['getAttributeList', 'setAttributeList', 'getAttributeConfig'],
  config: [
    'getServerConfig',
    'getServerOverrides',
    'getServerConfigSchema',
    'setServerConfig',
    'uploadServerConfigFile',
    'getConfigValue',
  ],
  services: ['listServices', 'listHosts', 'spawnService', 'patchService', 'deleteService'],
  operations: ['operations'],
  permissions: ['getMyPermissions', 'getMyProjectPermissions'],
}

const buildOutputFiles = (files: { [name: string]: string[] }) =>
  Object.entries(files).reduce((acc, [name, endpoints]) => {
    const regexArr = endpoints.map((endpoint) => new RegExp(endpoint, 'i'))
    return {
      ...acc,
      [`../shared/src/api/generated/${name}.ts`]: { filterEndpoints: regexArr },
    }
  }, {})

const config: ConfigFile = {
  schemaFile: `http://localhost:3000/openapi.json`,
  apiFile: '@shared/api/base',
  exportName: 'api',
  apiImport: 'api',
  outputFiles: buildOutputFiles(outputFiles),
  endpointOverrides: [
    {
      pattern: 'checkBundleCompatibility',
      type: 'query',
    },
  ],
}

export default config
