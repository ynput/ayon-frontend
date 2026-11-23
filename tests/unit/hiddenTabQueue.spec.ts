import { expect, test } from '@playwright/test'
import {
  createHiddenTabQueue,
  HIDDEN_TAB_MAX_QUEUED,
  isLiveWhenHidden,
  takeDroppedTopicTags,
} from '../../shared/src/util/hiddenTab'

const entityEvent = (topic: string, entityId: string, id = `${topic}-${entityId}-${Math.random()}`) => ({
  id,
  topic,
  project: 'demo',
  summary: { entityId },
})

test.beforeEach(() => {
  takeDroppedTopicTags()
})

test('merges repeats of the same topic and entity, and status updates of one event', () => {
  const queue = createHiddenTabQueue()
  queue.add('entity.task.status_changed', { ...entityEvent('entity.task.status_changed', 'a'), summary: { entityId: 'a', value: 'WIP' } })
  queue.add('entity.task.renamed', entityEvent('entity.task.renamed', 'a'))
  queue.add('entity.task.status_changed', { ...entityEvent('entity.task.status_changed', 'a'), summary: { entityId: 'a', value: 'Done' } })
  queue.add('entity.task.status_changed', entityEvent('entity.task.status_changed', 'b'))
  queue.add('reviewable.process', { id: 'e1', topic: 'reviewable.process', status: 'in_progress' })
  queue.add('reviewable.process', { id: 'e1', topic: 'reviewable.process', status: 'finished' })
  // no entity and no event id: never merged
  queue.add('shout', { topic: 'shout' })
  queue.add('shout', { topic: 'shout' })

  const { messages, received, tags, lostUntagged } = queue.take()
  expect(received).toBe(8)
  expect(tags).toEqual([])
  expect(lostUntagged).toBe(false)
  // a merged message takes the place of its latest update
  expect(messages.map(({ topic, data }) => [topic, data.summary?.entityId ?? data.status])).toEqual([
    ['entity.task.renamed', 'a'],
    ['entity.task.status_changed', 'a'],
    ['entity.task.status_changed', 'b'],
    ['reviewable.process', 'finished'],
    ['shout', undefined],
    ['shout', undefined],
  ])
  expect(messages[1].data.summary.value).toBe('Done')

  expect(queue.take()).toEqual({ messages: [], received: 0, lostUntagged: false, tags: [] })
})

test('a queue that grows too long drops what a refetch can replace and keeps the rest', () => {
  const queue = createHiddenTabQueue()
  queue.add('addon.install_from_url', { id: 'install', topic: 'addon.install_from_url' })
  for (let i = 0; i <= HIDDEN_TAB_MAX_QUEUED; i++) {
    queue.add('entity.version.created', entityEvent('entity.version.created', `v${i}`))
  }
  // dropped topics are not queued again until the tab is visible
  queue.add('entity.version.status_changed', entityEvent('entity.version.status_changed', 'v1'))
  queue.add('activity.created', { id: 'act', topic: 'activity.created', summary: {} })

  const { messages, tags, lostUntagged } = queue.take()
  expect(messages.map((m) => m.topic)).toEqual(['addon.install_from_url', 'activity.created'])
  expect(tags).toEqual(
    expect.arrayContaining(['version', 'product', 'entities', 'entityListItem', 'review']),
  )
  expect(tags).not.toContain('activity')
  expect(lostUntagged).toBe(false)
})

test('a flood of topics nothing can refetch for is dropped as a whole', () => {
  const queue = createHiddenTabQueue()
  for (let i = 0; i <= HIDDEN_TAB_MAX_QUEUED; i++) {
    queue.add('addon.install_from_url', { id: `e${i}`, topic: 'addon.install_from_url' })
  }
  const { messages, lostUntagged } = queue.take()
  expect(messages).toEqual([])
  expect(lostUntagged).toBe(true)
})

test('keeps desktop notifications and Review session changes live', () => {
  expect(isLiveWhenHidden('inbox.message', {})).toBe(true)
  expect(
    isLiveWhenHidden('entity_list.changed', { summary: { entity_list_type: 'review-session' } }),
  ).toBe(true)
  expect(isLiveWhenHidden('entity_list.changed', { summary: { entity_list_type: 'generic' } })).toBe(
    false,
  )
  expect(isLiveWhenHidden('entity.version.created', { summary: {} })).toBe(false)
  expect(isLiveWhenHidden('reviewable.process', {})).toBe(false)
})
