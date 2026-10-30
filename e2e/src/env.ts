const required = (...keys: string[]) => {
  for (const key of keys) {
    const value = process.env[key]
    if (value) return value
  }
  throw new Error(`Missing env variable ${keys[0]}. Add it to .env.test.local (see @ynput/ayon-e2e AGENTS.md).`)
}

/** Admin account that sets up and cleans up. NAME/PASSWORD are the legacy names from .env.local */
export const adminCredentials = () => ({
  name: required('TEST_USER_NAME', 'NAME'),
  password: required('TEST_USER_PASSWORD', 'PASSWORD'),
})

/**
 * The addon under test and where `ayon-addon dev --ayon` serves its build, when the suite is an
 * addon's (`ayonConfig({ addon })` sets both). AYON loads that build instead of the installed one.
 */
export const addonDev = (): { addon: string; url: string } | undefined => {
  const addon = process.env.TEST_ADDON_NAME
  return addon ? { addon, url: required('TEST_ADDON_URL') } : undefined
}
