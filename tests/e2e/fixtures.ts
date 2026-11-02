import { ayonTest, expect } from '@ynput/ayon-e2e'
import { AyonApi } from './support/api'

/**
 * AYON's fixtures from @ynput/ayon-e2e (`api`, `projectName`, `createUser`, `accessGroup`, a `page`
 * without one-off prompts), with `api` the frontend's client.
 */
export const test = ayonTest(AyonApi)

export { expect }
