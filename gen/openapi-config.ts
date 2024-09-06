import type { ConfigFile } from '@rtk-query/codegen-openapi'

// Specify the endpoints you want to generate
const outputFiles = {
  // bundles: ['listBundles', 'checkBundleCompatibility', 'migrateSettingsByBundle'],
  // folders: ['getFolderHierarchy', 'getFolderList'],
  // market: ['marketAddonList', 'marketAddonDetail', 'marketAddonVersionDetail'],
  // watchers: ['getEntityWatchers', 'setEntityWatchers'],
  // inbox: ['manageInboxItem'],
  // project: ['getProject', 'listProjects', 'getProjectAnatomy'],
  // review: [
  //   'getReviewablesForVersion',
  //   'getReviewablesForProduct',
  //   'getReviewablesForTask',
  //   'getReviewablesForFolder',
  //   'sortVersionReviewables',
  //   'updateReviewable',
  //   'uploadReviewable',
  // ],
  // actions: ['listAvailableActionsForContext', 'executeAction'],
  // accessGroups: [
  //   'getAccessGroupSchema',
  //   'getAccessGroups',
  //   'getAccessGroup',
  //   'deleteAccessGroup',
  //   'saveAccessGroup',
  // ],
  // auth: ['createSession'],
  // addons: ['listAddons'],
  // activities: ['deleteProjectActivity'],
  // users: ['getUser'],
  releases: ['getReleases', 'getReleaseInfo'],
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
  schemaFile: `https://test.ayon.dev/openapi.json`,
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
