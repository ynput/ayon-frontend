import { expect, test } from '@playwright/test'
import { getRequestErrorString } from '../../shared/src/util/errorHandling'

test('formats the detail from a structured request error', () => {
  expect(
    getRequestErrorString({
      status: 409,
      data: { code: 409, detail: 'Project Test_1 (Tes) already exists' },
    }),
  ).toBe('Project Test_1 (Tes) already exists')
})
