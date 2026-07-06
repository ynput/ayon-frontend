const { getIntrospectionQuery, buildClientSchema, introspectionFromSchema } = require('graphql')

module.exports = async () => {
  const token = process.env.TOKEN

  console.log('Loader: Fetching and sanitizing backend schema...')

  const response = await fetch('http://localhost:3000/graphql', {
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
