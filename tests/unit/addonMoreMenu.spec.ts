import { expect, test } from '@playwright/test'
import { createElement } from 'react'
import type { AddonMenuItem } from '../../addon/src/slots'
import type { HostMoreMenuProps } from '../../addon/src/MoreMenu'
import { MoreMenu } from '../../addon/src/MoreMenu'
import { provideHost } from '../../addon/src/hostBridge'
import { toContextMenuItems, toMenuItems } from '../../shared/src/components/AddonLayout/AddonButtonHelpers'
import { registerManifests, setContributionTags } from '../../addon/src/registry'
import { useSlotMenuItems } from '../../addon/src/SlotOutlet'
import { renderToHtml } from './support/render'

const noop = () => {}

test('addon menu items become the shared Menu items', () => {
  const items: AddonMenuItem[] = [
    { id: 'add', label: 'Add', icon: 'add', onClick: noop },
    { divider: true },
    { id: 'docs', label: 'Docs', href: 'https://ayon.app' },
    { id: 'page', label: 'Page', to: '/dashboard/x', disabled: true },
    {
      id: 'more',
      label: 'More',
      items: [{ id: 'sub', label: 'Sub', danger: true, onClick: noop }],
    },
  ]
  const menu = toMenuItems(items, noop)
  expect(menu.map((item) => item.id)).toEqual(['add-0', 'divider', 'docs-2', 'page-3', 'more-4'])
  expect(menu[2]).toMatchObject({ link: 'https://ayon.app', target: '_blank' })
  expect(menu[3]).toMatchObject({ link: '/dashboard/x', disabled: true })
  expect(menu[4].items?.[0]).toMatchObject({ id: 'sub-0', label: 'Sub', danger: true })
})

// An addon's own menu (MoreMenu, useContextMenu) from its slot's entries, as the docs show: the
// slot inspector's tags on each entry reach the rendered items of both menus.
test("an addon's own menus keep the slot inspector's tags of its slot's entries", () => {
  const owner = { name: 'example', version: '1.0.0', remote: 'example' }
  const contributor = { name: 'contributor', version: '1.0.0', remote: 'contributor' }
  const slot = 'example.cardMenuItem'
  registerManifests([
    { addon: owner, manifest: { contributes: [], slots: [{ name: slot, version: 1, required: ['label'], pieces: ['run'] }] } },
    {
      addon: contributor,
      manifest: {
        contributes: [{ slot, slotVersion: 1, id: 'open', label: 'Open', run: () => Promise.resolve({ default: noop }) }],
      },
    },
  ])
  setContributionTags(true)
  try {
    let entries: AddonMenuItem[] = []
    const Card = () => {
      const build = useSlotMenuItems(slot as never) as unknown as (context: object) => {
        top: object[]
        bottom: object[]
      }
      const { top, bottom } = build({})
      entries = [...top, ...bottom].map(({ command, ...item }: { command?: () => void }) => ({
        ...item,
        onClick: command,
      })) as AddonMenuItem[]
      return null
    }
    renderToHtml(Card)
    const tags = {
      'data-ayon-addon': 'contributor',
      'data-ayon-slot': slot,
      'data-ayon-contribution': 'contributor.open',
    }
    const menu = toMenuItems(entries, noop)
    expect(menu[0]).toMatchObject({ label: 'Open', ...tags })
    expect(toContextMenuItems(menu, noop)[0]).toMatchObject({ label: 'Open', ...tags })
  } finally {
    setContributionTags(false)
    registerManifests([])
  }
})

// a throwing or rejecting onClick, also in a submenu, is reported instead of breaking the menu
test('a failing item goes to onError', async () => {
  const errors: unknown[] = []
  const menu = toMenuItems(
    [
      {
        id: 'throws',
        label: 'Throws',
        onClick: () => {
          throw new Error('sync')
        },
      },
      {
        id: 'sub',
        label: 'Sub',
        items: [
          {
            id: 'rejects',
            label: 'Rejects',
            onClick: async () => {
              throw new Error('async')
            },
          },
        ],
      },
    ],
    (error) => errors.push(error),
  )
  menu[0].onClick?.({} as never)
  menu[1].items?.[0].onClick?.({} as never)
  await new Promise((resolve) => setTimeout(resolve))
  expect(errors.map((error) => (error as Error).message).sort()).toEqual(['async', 'sync'])
})

test('MoreMenu renders the host implementation with its props and onError', () => {
  let received: HostMoreMenuProps | undefined
  provideHost({
    components: {
      MoreMenu: (props: HostMoreMenuProps) => {
        received = props
        return createElement('button', { 'data-testid': props['data-testid'] }, props.label)
      },
    },
  })
  const items: AddonMenuItem[] = [{ id: 'a', label: 'A', onClick: noop }]
  const html = renderToHtml(MoreMenu, { items, label: 'Actions', 'data-testid': 'more' })
  expect(html).toBe('<button data-testid="more">Actions</button>')
  expect(received?.items).toBe(items)
  expect(typeof received?.onError).toBe('function')
})
