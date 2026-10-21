import { expect, test } from '@playwright/test'
import {
  buildDuplicateListPayload,
  getDuplicateListLabel,
} from '../../src/pages/ProjectListsPage/util/duplicateList'

type List = Parameters<typeof buildDuplicateListPayload>[0]

const item = (entityId: string, position: number, extra = {}) => ({
  id: `item-${entityId}`,
  entityId,
  position,
  folderPath: '/sh010',
  createdBy: 'admin',
  createdAt: '2026-01-01T00:00:00Z',
  ...extra,
})

const list: List = {
  id: 'list-1',
  label: 'Dailies',
  entityType: 'task',
  entityListType: 'generic',
  entityListFolderId: 'folder-1',
  owner: 'alice',
  active: false,
  access: { 'user:bob': 20, 'team:comp': 10, __guests__: 10, 'guest:client@studio.com': 10 },
  attrib: { description: 'Monday' },
  data: {
    attributes: [{ name: 'clientNote', data: { type: 'string' } }],
    guestActivityCategories: { 'client@studio.com': 'client' },
    publicLinks: [{ id: 'link' }],
  },
  tags: ['review'],
  items: [
    item('anim', 1, { label: 'Anim', attrib: { clientNote: 'ok' }, tags: ['a'] }),
    item('comp', 0),
  ],
}

test('copy labels skip the ones already taken', () => {
  expect(getDuplicateListLabel('Dailies', ['Dailies'])).toBe('Dailies (copy)')
  expect(getDuplicateListLabel('Dailies', ['Dailies (copy)'])).toBe('Dailies (copy 2)')
  expect(getDuplicateListLabel('Dailies', ['Dailies (copy)', 'Dailies (copy 2)'])).toBe(
    'Dailies (copy 3)',
  )
})

test('the copy keeps the list contents in order and gets new ids', () => {
  const payload = buildDuplicateListPayload(list, 'Dailies (copy)')

  expect(payload).toEqual({
    label: 'Dailies (copy)',
    entityType: 'task',
    entityListType: 'generic',
    entityListFolderId: 'folder-1',
    access: { 'user:bob': 20, 'team:comp': 10 },
    attrib: { description: 'Monday' },
    data: { attributes: [{ name: 'clientNote', data: { type: 'string' } }] },
    template: undefined,
    tags: ['review'],
    active: true,
    items: [
      { entityId: 'comp', label: undefined, attrib: undefined, data: undefined, tags: undefined },
      {
        entityId: 'anim',
        label: 'Anim',
        attrib: { clientNote: 'ok' },
        data: undefined,
        tags: ['a'],
      },
    ],
  })
  expect(payload).not.toHaveProperty('id')
  expect(payload).not.toHaveProperty('owner')
})
