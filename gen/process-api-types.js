const fs = require('fs')
const path = require('path')

// Directory where generated files are stored
const generatedDir = path.join(__dirname, '..', 'shared', 'src', 'api', 'generated')

// Process all TypeScript files in the generated directory
function processGeneratedFiles() {
  // Check if directory exists
  if (!fs.existsSync(generatedDir)) {
    console.error(`Directory does not exist: ${generatedDir}`)
    return
  }

  const files = fs.readdirSync(generatedDir).filter((file) => file.endsWith('.ts'))

  let totalReplacements = 0

  files.forEach((file) => {
    const filePath = path.join(generatedDir, file)
    const content = fs.readFileSync(filePath, 'utf8')

    // Replace 'data?: object' with 'data?: Record<string, any>'
    const newContent = content.replace(/data\?:\s*object/g, 'data?: Record<string, any>')

    // Count replacements
    const replacementsCount = (newContent.match(/data\?:\s*Record<string, any>/g) || []).length

    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent)
      console.log(`Processed ${file}: ${replacementsCount} replacements`)
      totalReplacements += replacementsCount
    }
  })

  console.log(`Total replacements across all files: ${totalReplacements}`)
}

processGeneratedFiles()
