import path from 'path'

/** the admin's session, saved by auth.setup.ts; the chromium project starts signed in with it */
export const AUTH_FILE = path.join(__dirname, '../../../playwright/.auth/admin.json')
