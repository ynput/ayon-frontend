import type { ConfigFile } from '@rtk-query/codegen-openapi'

const config: ConfigFile = {
  schemaFile: 'http://localhost:3000/openapi.json',
  apiFile: '../src/services/ayon.ts',
  exportName: 'restApi',
  apiImport: 'RestAPI',
  outputFile: '../src/types/restTypes.ts',
  filterEndpoints: [/^(?!.*sitesync).*$/i], // sitesync has a negative value that causes an error
}

export default config
