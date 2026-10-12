import { test } from '@playwright/test'
import { randomBytes } from 'crypto'

/**
 * Every entity the tests create is prefixed so leftovers are easy to spot and sweep.
 * The run id keeps parallel runs (e.g. two developers against one server) apart and lets
 * the global teardown only touch entities created by this run.
 */
export const E2E_PREFIX = 'e2e'

// set in playwright.config.ts so the main process and all workers share it
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
    // called outside of a test (e.g. global teardown)
  }
  counter += 1
  const random = randomBytes(2).toString('hex')
  return `${E2E_PREFIX}_${RUN_ID}_${label}_${worker}${counter}${random}`
}

/** Prefix that matches everything created by the current run */
export const runPrefix = () => `${E2E_PREFIX}_${RUN_ID}_`
