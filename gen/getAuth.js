const axios = require('axios')
const fs = require('fs')
const { spawn } = require('child_process')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const serverUrl = process.env.SERVER_URL || 'http://localhost:5000'

async function getToken() {
  try {
    const response = await axios.post(`${serverUrl}/api/auth/login`, {
      name: process.env.NAME,
      password: process.env.PASSWORD,
    })

    const token = `TOKEN=${response.data.token}`

    // write to .env file
    fs.writeFileSync('./gen/.env', token)

    // copy token to clipboard
    const platform = process.platform
    const clipboardProcess =
      platform === 'darwin'
        ? spawn('pbcopy')
        : platform === 'win32'
        ? spawn('clip')
        : spawn('xclip', ['-selection', 'clipboard'])

    clipboardProcess.on('error', (err) => {
      console.error('Failed to copy token to clipboard:', err)
    })
    clipboardProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Token copied to clipboard.')
      } else {
        console.error('Failed to copy token to clipboard.')
      }
    })
    clipboardProcess.stdin.write(response.data.token)
    clipboardProcess.stdin.end()
  } catch (error) {
    console.error('Error getting token', error)
  }
}

getToken()
