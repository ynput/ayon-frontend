const axios = require('axios')
const fs = require('fs')
const { exec } = require('child_process')
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
    const clipboardCmd =
      platform === 'darwin'
        ? `echo "${response.data.token}" | pbcopy`
        : platform === 'win32'
        ? `echo ${response.data.token} | clip`
        : `echo "${response.data.token}" | xclip -selection clipboard`

    exec(clipboardCmd, (err) => {
      if (err) {
        console.error('Failed to copy token to clipboard:', err)
      } else {
        console.log('Token copied to clipboard.')
      }
    })
  } catch (error) {
    console.error('Error getting token', error)
  }
}

getToken()
