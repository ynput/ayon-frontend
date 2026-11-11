// The slots of a made-up addon "example", as its contract package would ship them.
export const slots = [
  {
    name: 'example.cardBadge',
    version: 1,
    description: 'a badge in the header of a card on the example board',
    required: ['label'],
    pieces: ['component'],
  },
  {
    name: 'example.cardMenuItem',
    version: 1,
    description: "an item in a card's right-click menu",
    required: ['label', 'icon'],
    pieces: ['run'],
  },
  {
    name: 'example.boardDialog',
    version: 1,
    required: ['label'],
    pieces: ['dialog'],
  },
]
