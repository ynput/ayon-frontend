require('dotenv').config({ path: __dirname + '/.env' })
const fs = require('fs')
const path = require('path')
const http = require('http')

// Function to download the OpenAPI schema
async function downloadOpenApiSchema() {
  console.log('Downloading OpenAPI schema...')

  try {
    const schemaPath = path.join(__dirname, 'openapi.json')
    const apiUrl = 'http://localhost:3000/openapi.json'
    const token = process.env.TOKEN

    // Create a promise-based HTTP request
    await new Promise((resolve, reject) => {
      const options = {
        headers: {},
      }
      if (token) {
        options.headers['Authorization'] = `Bearer ${token}`
      }

      const req = http.get(apiUrl, options, (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP error! Status: ${res.statusCode}`))
        }

        const data = []
        res.on('data', (chunk) => data.push(chunk))
        res.on('end', () => {
          try {
            const buffer = Buffer.concat(data)
            const jsonString = buffer.toString()

            // Validate JSON
            const schema = JSON.parse(jsonString)

            // Write to file
            fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2))
            console.log(`OpenAPI schema saved to ${schemaPath}`)
            resolve()
          } catch (error) {
            reject(new Error(`Error processing response: ${error.message}`))
          }
        })
      })

      req.on('error', reject)
      req.end()
    })

    return true
  } catch (error) {
    console.error('Error downloading OpenAPI schema:', error)
    process.exit(1) // Exit with error code
  }
}

// Run the download
downloadOpenApiSchema()
