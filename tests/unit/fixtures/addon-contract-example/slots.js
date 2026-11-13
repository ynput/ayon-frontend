// The slots of a made-up addon "example", as its contract package would ship them.
export const slots = [
  {
    name: 'example.cardBadge',
    version: 1,
    label: 'Card badge',
    description: 'a badge in the header of a card on the example board',
    required: ['label'],
    pieces: ['component'],
  },
  {
    name: 'example.cardMenuItem',
    version: 1,
    label: 'Card menu item',
    description: "an item in a card's right-click menu",
    required: ['label', 'icon'],
    pieces: ['run'],
  },
  {
    // no label: the dev shell names it from the name ("Card end item")
    name: 'example.cardEndItem',
    version: 1,
    description: 'after the title, at the end of a card',
    required: ['label'],
    pieces: ['component'],
  },
  {
    name: 'example.boardDialog',
    version: 1,
    required: ['label'],
    pieces: ['dialog'],
  },
]
