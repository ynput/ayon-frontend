import type { ConfigFile } from '@rtk-query/codegen-openapi'
import fs from 'fs'
import path from 'path'

// Function to convert space-separated words or snake_case to camelCase
function toCamelCase(str: string): string {
  // First handle snake_case
  const withoutUnderscores = str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace('-', '').replace('_', ''),
  )

  // Then handle space-separated words (like "entity lists" to "entityLists")
  return withoutUnderscores
    .replace(/\s+(.)/g, (_, char) => char.toUpperCase())
    .replace(/\s/g, '')
    .replace(/^(.)/, (firstChar) => firstChar.toLowerCase())
}

// Read the OpenAPI schema from the local file
function getOpenApiSchema() {
  const schemaPath = path.join(__dirname, 'openapi.json')

  if (fs.existsSync(schemaPath)) {
    try {
      const data = fs.readFileSync(schemaPath, 'utf8')
      return JSON.parse(data)
    } catch (error) {
      console.error('Error reading OpenAPI schema file:', error)
      throw new Error('Failed to parse OpenAPI schema file')
    }
  }

  throw new Error('OpenAPI schema file not found. Run "yarn download-openapi" first.')
}

// Generate output files configuration from OpenAPI schema
function generateOutputFiles(filterTags: string[] = []) {
  const openapi = getOpenApiSchema()
  const endpointsByTag: Record<string, string[]> = {}
  const seenOperationIds = new Set<string>()

  // Process paths and operations
  for (const [path, operations] of Object.entries(openapi.paths)) {
    for (const [method, operation] of Object.entries(operations as Record<string, any>)) {
      // Skip if no operationId
      if (!operation.operationId) continue

      const operationId = toCamelCase(operation.operationId)

      // Skip if we've already seen this operation ID
      if (seenOperationIds.has(operationId)) {
        console.warn(`Duplicate operationId found: ${operationId}. Skipping.`)
        continue
      }

      // Mark this operation ID as seen
      seenOperationIds.add(operationId)

      // If no tags, put in misc category, otherwise convert tag name to camelCase
      const rawTag = operation.tags && operation.tags.length ? operation.tags[0] : 'misc'
      // Handle 'misc' specially, otherwise convert to camelCase
      const tag = rawTag.toLowerCase() === 'misc' ? 'misc' : toCamelCase(rawTag)

      // Skip if filtering by tags and this tag is not included
      if (filterTags.length > 0 && !filterTags.includes(tag)) {
        continue
      }

      // Initialize tag array if it doesn't exist
      if (!endpointsByTag[tag]) {
        endpointsByTag[tag] = []
      }

      // Add operation to the appropriate tag
      endpointsByTag[tag].push(operationId)
    }
  }

  return endpointsByTag
}

// Parse command line arguments for tag filtering
function parseTagFilters(): string[] {
  // Node.js passes script arguments starting from index 2
  const args = process.argv.slice(2)

  // Find arguments after the script file
  const scriptIndex = args.findIndex((arg) => arg.includes('openapi-config.ts'))

  // If found, take all arguments after the script
  if (scriptIndex !== -1) {
    return args.slice(scriptIndex + 1)
  }

  // Otherwise, look for any arguments that don't start with '-'
  // as these are likely tag names
  return args.filter((arg) => !arg.startsWith('-') && arg !== '--')
}

// Get filter tags from command line arguments
const filterTags = parseTagFilters()
if (filterTags.length > 0) {
  console.log('Filtering by tags:', filterTags.join(', '))
}

// Use the dynamic configuration with optional tag filtering
const outputFiles = generateOutputFiles(filterTags)

const buildOutputFiles = (files: { [name: string]: string[] }) =>
  Object.entries(files).reduce((acc, [name, endpoints]) => {
    const regexArr = endpoints.map((endpoint) => new RegExp(endpoint, 'i'))
    return {
      ...acc,
      [`../shared/src/api/generated/${name}.ts`]: { filterEndpoints: regexArr },
    }
  }, {})

const config: ConfigFile = {
  schemaFile: path.join(__dirname, 'openapi.json'),
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
