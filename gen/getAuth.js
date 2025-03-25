// eslint-disable-next-line
const axios = require('axios')
// eslint-disable-next-line
const fs = require('fs')

async function getToken() {
  try {
    // eslint-disable-next-line
    const response = await axios.post(`https://test.ayon.dev/api/auth/login`, {
      // eslint-disable-next-line
      name: process.env.NAME,
      // eslint-disable-next-line
      password: process.env.PASSWORD,
    })

    const token = `TOKEN=${response.data.token}`

    // write to .env file
    fs.writeFileSync('./gen/.env', token)
  } catch (error) {
    console.error('Error getting token', error)
  }
}

getToken()
