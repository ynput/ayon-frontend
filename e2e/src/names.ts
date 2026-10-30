import { test } from '@playwright/test'
import { randomBytes } from 'crypto'

/**
 * Every entity created by the e2e tests starts with `e2e_<runId>_`.
 * The run id keeps parallel runs (e.g. two developers against one server) apart and lets
 * the global teardown only touch entities created by this run.
 */
export const E2E_PREFIX = 'e2e'

// set once per run in the config (ayonConfig), inherited by every worker
export const RUN_ID = process.env.E2E_RUN_ID || 'local'

let counter = 0

/**
 * A name that is unique across tests, workers and runs.
 * Only `[a-zA-Z0-9_]` so it is valid for projects, folders, tasks, users, ...
 */
export const uniqueName = (label: string) => {
  let worker = 'x'
  try {
    worker = String(test.info().parallelIndex)
  } catch {
    // outside a test (global setup / teardown)
  }
  counter += 1
  const random = randomBytes(2).toString('hex')
  return `${E2E_PREFIX}_${RUN_ID}_${label}_${worker}${counter}${random}`
}

/** prefix shared by everything this run created */
export const runPrefix = () => `${E2E_PREFIX}_${RUN_ID}_`
