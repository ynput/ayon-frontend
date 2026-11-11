// The cases the dev shell renders contributions to the example addon's slots with. Plain JS: a
// frame copies only the layout around the slot (here a card header), with AYON's CSS variables.
import { createElement } from 'react'

const CardFrame = ({ context, children }) =>
  createElement(
    'div',
    {
      'data-example-card': context.card.id,
      style: {
        display: 'flex',
        gap: 8,
        padding: 8,
        borderRadius: 4,
        background: 'var(--md-sys-color-surface-container)',
      },
    },
    createElement('strong', null, context.card.title),
    children,
  )

const card = (id, title, status) => ({ projectName: 'demo', card: { id, title, status } })

export const previews = {
  'example.cardBadge': {
    frame: CardFrame,
    cases: [
      { label: 'A card in progress', context: card('c1', 'Layout', 'in_progress') },
      { label: 'A finished card', context: card('c2', 'Lighting', 'done') },
    ],
  },
  'example.cardMenuItem': {
    cases: [
      { label: 'One card', context: { projectName: 'demo', cards: [card('c1', 'Layout').card] } },
    ],
  },
}
