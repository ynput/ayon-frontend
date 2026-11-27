import { expect, test } from '@playwright/test'
import {
  buildAttributeItems,
  countItemFields,
  getItemKey,
} from '../../shared/src/components/DetailsPanelAttributes/DetailsPanelAttributesEditorHelpers'
import type { AttributeField } from '../../shared/src/components/DetailsPanelAttributes/DetailsPanelAttributesEditor'

const field = (name: string): AttributeField => ({ name, data: { type: 'string' } })

const fields = [
  'name',
  'label',
  'attrib.fps',
  'attrib.resolutionWidth',
  'attrib.resolutionHeight',
  'attrib.frameStart',
  'attrib.frameEnd',
  'attrib.handleStart',
  'attrib.handleEnd',
  'attrib.machine',
].map(field)

test('splits filled and empty fields, merging related attributes into groups', () => {
  const { filled, empty } = buildAttributeItems(fields, {
    name: 'v002',
    label: '',
    'attrib.fps': 25,
    'attrib.frameStart': null,
  })

  // a group sits where its first member is, and is filled when a main field has a value. An extra
  // field with a value is a row of its own
  expect(filled.map(getItemKey)).toEqual(['group:name', 'attrib.fps'])
  expect(empty.map(getItemKey)).toEqual(['group:resolution', 'group:frames', 'attrib.machine'])
  expect(countItemFields(empty)).toBe(7)
})

test('summarises the main fields, and puts extra fields with a value in rows of their own', () => {
  const { filled } = buildAttributeItems(
    fields,
    {
      'attrib.fps': 25,
      'attrib.resolutionWidth': 1920,
      'attrib.resolutionHeight': 1080,
      'attrib.frameStart': 1001,
      'attrib.frameEnd': 1100,
      'attrib.handleEnd': 0,
    },
    ['attrib.machine'],
  )
  const groups = Object.fromEntries(
    filled.flatMap((item) => (item.type === 'group' ? [[item.group.key, item.group]] : [])),
  )

  // a mixed value is a value, and so is 0
  expect(filled.map(getItemKey)).toEqual([
    'group:resolution',
    'attrib.fps',
    'group:frames',
    'attrib.handleEnd',
    'attrib.machine',
  ])
  expect(groups.resolution.summary).toBe('1920×1080')
  expect(groups.frames.summary).toBe('1001–1100')

  // one frame when both ends are the same
  const single = buildAttributeItems(fields, { 'attrib.frameStart': 1001, 'attrib.frameEnd': 1001 })
  const frames = single.filled.find((item) => getItemKey(item) === 'group:frames')
  expect(frames?.type === 'group' && frames.group.summary).toBe('1001')
  // the empty extra field opens with the group
  expect(groups.frames.fields.map((f) => f.name)).toEqual([
    'attrib.frameStart',
    'attrib.frameEnd',
    'attrib.handleStart',
  ])
})

test("keeps an extra field with the project's value inside its group", () => {
  const form = {
    'attrib.resolutionWidth': 1920,
    'attrib.resolutionHeight': 1080,
    'attrib.fps': 25,
    'attrib.frameStart': 1001,
    'attrib.frameEnd': 1100,
    'attrib.handleStart': 0,
    'attrib.handleEnd': 10,
  }
  const defaults = { 'attrib.fps': 25, 'attrib.handleStart': 0, 'attrib.handleEnd': 0 }

  const { filled } = buildAttributeItems(fields, form, [], defaults)
  const groups = Object.fromEntries(
    filled.flatMap((item) => (item.type === 'group' ? [[item.group.key, item.group]] : [])),
  )
  // only the handle end differs from the project
  expect(filled.map(getItemKey)).toEqual(['group:resolution', 'group:frames', 'attrib.handleEnd'])
  expect(groups.resolution.fields.map((f) => f.name)).toContain('attrib.fps')
  expect(groups.frames.fields.map((f) => f.name)).toContain('attrib.handleStart')

  // several entities with different values: mixed is news
  const mixed = buildAttributeItems(fields, form, ['attrib.fps'], defaults)
  expect(mixed.filled.map(getItemKey)).toContain('attrib.fps')
})

test('shows a label of its own right below the name, and keeps an empty one with it', () => {
  const nameFields = [field('name'), field('label')]

  const withLabel = buildAttributeItems(nameFields, { name: 'sh010', label: 'Opening shot' })
  expect(withLabel.filled.map(getItemKey)).toEqual(['name', 'label'])

  const withoutLabel = buildAttributeItems(nameFields, { name: 'sh010', label: '' })
  expect(withoutLabel.filled.map(getItemKey)).toEqual(['group:name'])
  expect(withoutLabel.empty).toEqual([])
  const [item] = withoutLabel.filled
  expect(item.type === 'group' && item.group.summary).toBe('sh010')
})

test('shows a checkbox even when it is unchecked or unset', () => {
  const report: AttributeField = { name: 'attrib.report', data: { type: 'boolean' } }
  const { filled, empty } = buildAttributeItems([report, field('label')], {})
  expect(filled.map(getItemKey)).toEqual(['attrib.report'])
  expect(empty.map(getItemKey)).toEqual(['label'])
})

test('keeps a group without a main field, or of one field, as plain fields', () => {
  const onlyExtra = buildAttributeItems([field('attrib.fps'), field('name')], { 'attrib.fps': 25 })
  expect(onlyExtra.filled.map(getItemKey)).toEqual(['attrib.fps'])

  const oneField = buildAttributeItems([field('attrib.fps'), field('attrib.resolutionWidth')], {
    'attrib.fps': 25,
    'attrib.resolutionWidth': 1920,
  })
  expect(oneField.filled.map(getItemKey)).toEqual(['attrib.fps', 'attrib.resolutionWidth'])
})
