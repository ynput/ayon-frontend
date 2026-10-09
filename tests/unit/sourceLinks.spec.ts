import { expect, test } from '@playwright/test'
import {
  getSourceLink,
  parseActivityLink,
} from '../../shared/src/components/MarkdownEditor/links/activityLinks'

const activityId = 'a'.repeat(32)
const entityId = 'b'.repeat(32)

test('source links keep the entity of the source comment', () => {
  const href = getSourceLink(activityId, { id: entityId, type: 'version' })
  expect(href).toBe(`source:${activityId}?type=version&id=${entityId}`)
  expect(parseActivityLink(href)).toEqual({
    activityId,
    entity: { id: entityId, type: 'version' },
    isSource: true,
  })
})

test('source links without an entity resolve with the containing comment', () => {
  expect(parseActivityLink(`source:${activityId}`)).toEqual({
    activityId,
    entity: null,
    isSource: true,
  })
  expect(parseActivityLink(`source:${activityId}?type=version&id=nope`)).toEqual({
    activityId,
    entity: null,
    isSource: true,
  })
})

test('rejects malformed source links', () => {
  for (const href of ['source:', 'source:123', `source:${activityId}x`]) {
    expect(parseActivityLink(href)).toBeNull()
  }
})
