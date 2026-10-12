import path from 'path'

export const AUTH_FILE = path.join(__dirname, '../../../playwright/.auth/admin.json')

const required = (...keys: string[]) => {
  for (const key of keys) {
    const value = process.env[key]
    if (value) return value
  }
  throw new Error(
    `Missing env variable ${keys[0]}. Add it to .env.test.local (see tests/AGENTS.md).`,
  )
}

/** Admin account the suite runs as. NAME/PASSWORD are the legacy names from .env.local */
export const adminCredentials = () => ({
  name: required('TEST_USER_NAME', 'NAME'),
  password: required('TEST_USER_PASSWORD', 'PASSWORD'),
})
