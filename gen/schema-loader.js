const { getIntrospectionQuery, buildClientSchema, introspectionFromSchema } = require('graphql')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

module.exports = async () => {
  const token = process.env.TOKEN
  const serverUrl = process.env.SERVER_URL || 'http://localhost:5000'

  console.log('Loader: Fetching and sanitizing backend schema...')

  const response = await fetch(`${serverUrl}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query: getIntrospectionQuery() }),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch schema: ${response.statusText}`)
  }

  let schemaText = await response.text()

  // Strip out the unsupported draft token and swap it with a safe spec location
  schemaText = schemaText.replace(/"DIRECTIVE_DEFINITION"/g, '"SCHEMA"')

  const { data } = JSON.parse(schemaText)

  // Return the client-compatible schema object back to codegen
  return buildClientSchema(data)
}
