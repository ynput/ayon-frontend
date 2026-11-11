// The preview scenes of a made-up addon "example": a mock of its board card, which renders its
// slots with the SDK as the addon does, with contexts built from the values of the scene's form.
// Plain JS (no JSX), the layout only, with AYON's CSS variables.
import { createElement as h, useMemo } from 'react'
import { SlotOutlet, useContextMenu, useSlotMenuItems } from '@ynput/ayon-addon'

const Card = ({ values, setValues }) => {
  const card = useMemo(
    () => ({ id: values.card || 'c1', title: values.title, status: values.status, attrib: values.attrib }),
    [values.card, values.title, values.status, values.attrib],
  )
  const context = useMemo(
    () => ({ projectName: values.project, card, task: values.task }),
    [values.project, card, values.task],
  )
  const menuItems = useSlotMenuItems('example.cardMenuItem')
  const openContextMenu = useContextMenu()
  return h(
    'div',
    {
      'data-example-card': card.id,
      style: { display: 'flex', gap: 8, padding: 8, background: 'var(--md-sys-color-surface-container)' },
      onContextMenu: (event) => {
        const { top, bottom } = menuItems({ projectName: values.project, cards: [card] })
        openContextMenu(event, [...top, ...bottom])
      },
      onDoubleClick: () => setValues({ status: 'done' }),
    },
    h('strong', null, card.title),
    // where the addon puts the badges
    h(SlotOutlet, { slot: 'example.cardBadge', context }),
  )
}

export const previews = [
  {
    id: 'card',
    label: 'A card on the board',
    description: 'A card as the board shows it: badges in its header, right-click for its menu',
    slots: ['example.cardBadge', 'example.cardMenuItem'],
    fields: [
      { key: 'project', label: 'Project', type: 'project', optional: true },
      { key: 'title', label: 'Title', type: 'text', default: 'Layout' },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'in_progress', label: 'In progress' },
          { value: 'done', label: 'Done' },
        ],
        default: 'in_progress',
      },
      { key: 'estimate', label: 'Estimate', type: 'number', hint: 'hours' },
      { key: 'pinned', label: 'Pinned', type: 'boolean' },
      {
        key: 'tags',
        label: 'Tags',
        type: 'multiselect',
        options: [
          { value: 'urgent', label: 'Urgent' },
          { value: 'client', label: 'Client' },
        ],
      },
      { key: 'attrib', label: 'Attributes', type: 'json', default: { priority: 'high' } },
      { key: 'task', label: 'Task', type: 'entity', entityType: 'task', project: 'project' },
      {
        key: 'card',
        label: 'A real card',
        type: 'pick',
        load: async (api, values) => {
          const base = api.addonUrl('example')
          if (!base) throw new Error('the example addon is not installed on the server')
          const response = await api.fetch(`${base}/cards?project=${values.project || ''}`)
          const { cards } = await response.json()
          return cards.map((card) => ({ value: card.id, label: card.title, values: { title: card.title } }))
        },
      },
    ],
    component: Card,
  },
]
