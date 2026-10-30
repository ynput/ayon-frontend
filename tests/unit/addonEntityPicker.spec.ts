import { expect, test } from '@playwright/test'
import {
  toEntityRefs,
  toPickerSelection,
} from '../../shared/src/components/AddonLayout/AddonEntityPickerHelpers'

test('the initial selection goes to each entity type, unknown types are ignored', () => {
  expect(
    toPickerSelection([
      { id: 'f1', entityType: 'folder' },
      { id: 't1', entityType: 'task' },
      { id: 't2', entityType: 'task' },
      { id: 'x', entityType: 'project' },
    ]),
  ).toEqual({ folder: { f1: true }, task: { t1: true, t2: true } })
  expect(toPickerSelection(undefined)).toEqual({})
})

test('picked ids become EntityRefs with the names the picker loaded', () => {
  const task = { id: 't1', name: 'compositing', label: 'Comp', entityType: 'task' } as never
  const folder = { id: 't2', name: 'sh010', label: null } as never
  expect(toEntityRefs(['t1', 't2', 't3'], [task, folder, undefined], 'task', 'demo')).toEqual([
    { id: 't1', entityType: 'task', projectName: 'demo', name: 'compositing', label: 'Comp' },
    { id: 't2', entityType: 'task', projectName: 'demo', name: 'sh010' },
    { id: 't3', entityType: 'task', projectName: 'demo' },
  ])
})
