// `ayon-addon generate-rest`: the addon's server endpoints as RTK Query endpoints injected into
// AYON's api (they share its cache), from the OpenAPI schema of the installed addon.
//   1. downloads /api/addons/<name>/<version>/openapi.json (AYON's own /openapi.json has no addon
//      routes) to gen/openapi.json, with operation ids prefixed by the addon name
//   2. generates the endpoints with @rtk-query/codegen-openapi, without hooks
//   3. puts addonVersion in the URLs, so they call the version that is running
//   4. creates the file that enhances them (tags, optimistic updates) and exports their hooks, or
//      adds the hooks of new endpoints to it. The generated file is never edited by hand.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { createInterface } from 'readline/promises'
import {
  findConnection,
  importFromProject,
  readAddonProject,
  requireApiKey,
} from './project.js'

/** `rest` in ayonAddon(): where `ayon-addon generate-rest` writes, and what it can't tell itself. */
export interface RestOptions {
  /** the generated endpoints, never edited (default src/api/generated/<name>.ts) */
  generated?: string
  /** the file that enhances them and exports their hooks (default src/api/<name>.ts) */
  api?: string
  /** the module whose default export is the addon version (default src/addonVersion.ts) */
  versionModule?: string
  /** the downloaded schema (default gen/openapi.json) */
  schema?: string
  /** endpoints that are POST but only read, generated as queries: `timetrackerQueryTimeLogs` */
  queries?: string[]
}

export interface GenerateRestOptions {
  root: string
  rest: RestOptions
  /** generate from this schema file instead of downloading it */
  schemaFile?: string
  /** add missing hooks without asking */
  hooks?: boolean
  /** may ask in the terminal */
  interactive: boolean
  log: (line: string) => void
}

export interface GenerateRestResult {
  url?: string
  schema: string
  generated: string
  api: string
  endpoints: { name: string; type: 'query' | 'mutation' }[]
  /** the enhanced api file was created */
  created: boolean
  /** hooks added to the enhanced api file */
  addedHooks: string[]
  /** hooks of endpoints the enhanced api file doesn't export */
  missingHooks: string[]
  /** hooks the enhanced api file exports for endpoints that are gone */
  staleHooks: string[]
}

// what this uses of @rtk-query/codegen-openapi, an optional peer: only this command needs it
type CodegenModule = {
  generateEndpoints: (options: {
    schemaFile: string
    apiFile: string
    apiImport: string
    exportName: string
    outputFile: string
    hooks: boolean
    filterEndpoints: (name: string, operation: { path: string }) => boolean
    endpointOverrides?: { pattern: string[]; type: 'query' | 'mutation' }[]
  }) => Promise<unknown>
}

type Operation = {
  operationId?: string
  parameters?: { in?: string; schema?: { anyOf?: { type?: string }[] } & Record<string, unknown> }[]
}

const camel = (name: string) =>
  name.replace(/[^A-Za-z0-9]+(.)?/g, (_, next: string | undefined) => (next ? next.toUpperCase() : ''))
const capitalize = (name: string) => name.charAt(0).toUpperCase() + name.slice(1)
const posixRelative = (from: string, to: string) => {
  const relative = path.relative(path.dirname(from), to).replace(/\\/g, '/').replace(/\.tsx?$/, '')
  return relative.startsWith('.') ? relative : `./${relative}`
}

export const hookName = ({ name, type }: { name: string; type: 'query' | 'mutation' }) =>
  `use${capitalize(name)}${type === 'query' ? 'Query' : 'Mutation'}`

const downloadSchema = async (
  root: string,
  addon: { name: string; version: string },
  interactive: boolean,
) => {
  const { serverUrl, apiKey: found } = findConnection(root)
  const apiKey = await requireApiKey(root, found, interactive)
  const url = `${serverUrl}/api/addons/${addon.name}/${addon.version}/openapi.json`
  const response = await fetch(url, { headers: { 'x-api-key': apiKey } })
  if (response.status === 401 || response.status === 403) {
    throw new Error(
      `${url} answered ${response.status}: the API key was refused, check AYON_API_KEY in the shell or in the .env files of this folder`,
    )
  }
  if (!response.ok) {
    throw new Error(`${url} answered ${response.status}: is ${addon.name} ${addon.version} installed there?`)
  }
  return { url, schema: (await response.json()) as { paths: Record<string, Record<string, Operation>> } }
}

// Every addon injects into AYON's one api: prefixed operation ids (timetrackerStartSession) can't
// clash with AYON's or another addon's endpoints.
const patchSchema = (schema: { paths: Record<string, Record<string, Operation>> }, prefix: string) => {
  for (const operations of Object.values(schema.paths)) {
    for (const operation of Object.values(operations)) {
      if (operation.operationId && !operation.operationId.startsWith(`${prefix}_`))
        operation.operationId = `${prefix}_${operation.operationId}`
      // optional headers are typed string | null, which fetch's headers don't take: a header is
      // either sent or not (AYON's own schema types them as string)
      for (const parameter of operation.parameters ?? []) {
        const types = parameter.in === 'header' ? parameter.schema?.anyOf : undefined
        if (types?.some((type) => type.type === 'null')) {
          const rest = { ...parameter.schema }
          delete rest.anyOf
          parameter.schema = { ...rest, ...types.find((type) => type.type !== 'null') }
        }
      }
    }
  }
  return schema
}

const readEndpoints = (source: string) =>
  [...source.matchAll(/^\s*(\w+): build\.(query|mutation)</gm)].map(([, name, type]) => ({
    name,
    type: type as 'query' | 'mutation',
  }))

const apiFileContent = (
  addonName: string,
  apiExport: string,
  generatedExport: string,
  generatedImport: string,
  hooks: string[],
) => `// ${addonName}'s server endpoints. They are generated into ${generatedImport}.ts by
// \`ayon-addon generate-rest\`: never edit that file, change them here instead (cache tags,
// transformResponse, optimistic updates). generate-rest offers to add the hooks of new endpoints.
import { ${generatedExport} } from "${generatedImport}";

export const ${apiExport} = ${generatedExport}.enhanceEndpoints({
  addTagTypes: [],
  endpoints: {},
});

export const {
${hooks.map((hook) => `  ${hook},`).join('\n')}
} = ${apiExport};
`

const confirm = async (question: string) => {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const answer = (await rl.question(`${question} (Y/n) `)).trim().toLowerCase()
    return answer === '' || answer === 'y' || answer === 'yes'
  } finally {
    rl.close()
  }
}

export const generateRest = async (options: GenerateRestOptions): Promise<GenerateRestResult> => {
  const { root, rest, log } = options
  const addon = readAddonProject(root)
  const id = camel(addon.name)
  const resolve = (file: string) => path.resolve(root, file)
  const generated = resolve(rest.generated || `src/api/generated/${addon.name}.ts`)
  const apiFile = resolve(rest.api || `src/api/${addon.name}.ts`)
  const versionModule = resolve(rest.versionModule || 'src/addonVersion.ts')
  const generatedExport = `${id}RestApi`
  const apiExport = `${id}Api`

  // 1. the schema
  let schema = resolve(options.schemaFile || rest.schema || 'gen/openapi.json')
  let url: string | undefined
  if (!options.schemaFile) {
    const download = await downloadSchema(root, addon, options.interactive)
    url = download.url
    mkdirSync(path.dirname(schema), { recursive: true })
    writeFileSync(schema, JSON.stringify(patchSchema(download.schema, addon.name), null, 2))
    log(`${path.relative(root, schema)}: ${Object.keys(download.schema.paths).length} paths from ${url}`)
  } else {
    schema = resolve(options.schemaFile)
    const patched = patchSchema(JSON.parse(readFileSync(schema, 'utf8')), addon.name)
    writeFileSync(schema, JSON.stringify(patched, null, 2))
  }

  // 2. the endpoints
  const { generateEndpoints } = await importFromProject<CodegenModule>(root, '@rtk-query/codegen-openapi').catch(
    () => {
      throw new Error('generate-rest needs @rtk-query/codegen-openapi: yarn add -D @rtk-query/codegen-openapi')
    },
  )
  const queries = new Set(rest.queries ?? [])
  mkdirSync(path.dirname(generated), { recursive: true })
  await generateEndpoints({
    schemaFile: schema,
    apiFile: '@ynput/ayon-frontend-shared/api',
    apiImport: 'api',
    exportName: generatedExport,
    outputFile: generated,
    hooks: false,
    // the addon's endpoints only
    filterEndpoints: (_name, operation) => operation.path.startsWith(`/api/addons/${addon.name}/`),
    endpointOverrides: queries.size ? [{ pattern: [...queries], type: 'query' }] : undefined,
  })

  // 3. the running version in the URLs
  let source = readFileSync(generated, 'utf8')
  source = source.replace(
    new RegExp(`/api/addons/${addon.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/[^/\`]+/`, 'g'),
    `/api/addons/${addon.name}/\${addonVersion}/`,
  )
  source =
    `// Generated by \`ayon-addon generate-rest\` from the addon's OpenAPI schema. Do not edit:\n` +
    `// enhance the endpoints in ${posixRelative(generated, apiFile)}.ts instead.\n` +
    `import addonVersion from "${posixRelative(generated, versionModule)}";\n` +
    source
  writeFileSync(generated, source)
  const endpoints = readEndpoints(source)
  log(`${path.relative(root, generated)}: ${endpoints.length} endpoints`)

  // 4. the enhanced api and its hooks
  const hooks = endpoints.map(hookName)
  const result: GenerateRestResult = {
    url,
    schema,
    generated,
    api: apiFile,
    endpoints,
    created: false,
    addedHooks: [],
    missingHooks: [],
    staleHooks: [],
  }
  if (!existsSync(apiFile)) {
    mkdirSync(path.dirname(apiFile), { recursive: true })
    writeFileSync(
      apiFile,
      apiFileContent(addon.name, apiExport, generatedExport, posixRelative(apiFile, generated), hooks),
    )
    result.created = true
    result.addedHooks = hooks
    log(`${path.relative(root, apiFile)}: created, enhance the endpoints there`)
    return result
  }

  const apiSource = readFileSync(apiFile, 'utf8')
  const exported = (hook: string) => new RegExp(`\\b${hook}\\b`).test(apiSource)
  result.missingHooks = hooks.filter((hook) => !exported(hook))
  const known = new Set(hooks)
  result.staleHooks = [...new Set(apiSource.match(new RegExp(`\\buse${capitalize(id)}\\w+(Query|Mutation)\\b`, 'g')))]
    .filter((hook) => !hook.startsWith('useLazy') && !known.has(hook))
  if (result.staleHooks.length) {
    log(`${path.relative(root, apiFile)} exports hooks of endpoints that are gone: ${result.staleHooks.join(', ')}`)
  }
  if (!result.missingHooks.length) return result

  const relative = path.relative(root, apiFile)
  const add =
    options.hooks ||
    (options.interactive &&
      (await confirm(`Export hooks for ${result.missingHooks.length} new endpoints in ${relative}?`)))
  if (!add) {
    log(`${relative} doesn't export: ${result.missingHooks.join(', ')} (add them with --hooks)`)
    return result
  }
  // a block of its own: the user's exports are left as they are
  const apiName = apiSource.match(new RegExp(`export const (\\w+) = ${generatedExport}\\b`))?.[1] || apiExport
  const block = `\n// added by ayon-addon generate-rest\nexport const {\n${result.missingHooks
    .map((hook) => `  ${hook},`)
    .join('\n')}\n} = ${apiName};\n`
  writeFileSync(apiFile, apiSource.replace(/\n*$/, '\n') + block)
  result.addedHooks = result.missingHooks
  result.missingHooks = []
  log(`${relative}: exported ${result.addedHooks.join(', ')}`)
  return result
}
