import { expect, test } from '@playwright/test'
import type { SimpleFormField } from '../../shared/src/api'
import { computeFieldPatches } from '../../shared/src/components/SimpleForm/ruleEngine'
import { getFieldErrors } from '../../shared/src/components/SimpleForm/validateFields'
import type { SimpleFormValueDict } from '../../shared/src/components/SimpleForm/types'

const fields: SimpleFormField[] = [
  { type: 'text', name: 'code', label: 'Code', regex: '^[a-z]+$' },
  { type: 'integer', name: 'count', label: 'Count', min: 1, max: 10 },
  { type: 'float', name: 'ratio', label: 'Ratio', min: 0, max: 1 },
  { type: 'text', name: 'note', label: 'Note' },
]

const errorsFor = (formFields: SimpleFormField[], values: SimpleFormValueDict) =>
  getFieldErrors(formFields, computeFieldPatches(formFields, values), values)

test('valid values have no errors', () => {
  expect(errorsFor(fields, { code: 'abc', count: 1, ratio: 1, note: 'Any 123' })).toEqual({})
})

test('regex, min and max are enforced', () => {
  expect(errorsFor(fields, { code: 'ABC', count: 0, ratio: 1.5, note: '' })).toEqual({
    code: 'Must match pattern ^[a-z]+$',
    count: 'Must be ≥ 1',
    ratio: 'Must be ≤ 1',
  })
  expect(errorsFor(fields, { code: 'abc', count: 11, ratio: -0.1 })).toEqual({
    count: 'Must be ≤ 10',
    ratio: 'Must be ≥ 0',
  })
})

test('empty values are not checked: the schema has no required rule', () => {
  expect(errorsFor(fields, { code: '', count: NaN, ratio: NaN })).toEqual({})
})

test('a field a rule hides or disables is not checked', () => {
  const withRule: SimpleFormField[] = [
    { type: 'boolean', name: 'custom', label: 'Custom' },
    {
      type: 'integer',
      name: 'frames',
      label: 'Frames',
      min: 1,
      rules: [{ when: { conditions: [{ key: 'custom', value: false }] }, set: { disabled: true } }],
    },
  ]
  expect(errorsFor(withRule, { custom: false, frames: 0 })).toEqual({})
  expect(errorsFor(withRule, { custom: true, frames: 0 })).toEqual({ frames: 'Must be ≥ 1' })
})

test('a regex JS cannot compile does not block the form', () => {
  const python: SimpleFormField[] = [{ type: 'text', name: 'n', regex: '(?P<name>a)' }]
  expect(errorsFor(python, { n: 'b' })).toEqual({})
})
