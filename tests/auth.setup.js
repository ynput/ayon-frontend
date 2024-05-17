import { test as setup } from '@playwright/test'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ request }) => {
  // Send authentication request. Replace with your own.
  await request.post('/api/auth/login', {
    form: {
      name: process.env.USER_NAME,
      password: process.env.PASSWORD,
    },
  })
  await request.storageState({ path: authFile })
})
