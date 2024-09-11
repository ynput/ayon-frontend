const reactionMapping: { key: ReactionType; value: string }[] = [
  { key: 'thumb_up', value: '👍' },
  { key: 'thumb_down', value: '👎' },
  { key: 'heart_plus', value: '❤' },
  { key: 'celebration', value: '🎉' },
  { key: 'notes', value: '📝' },
]

const reactionMappingObj: {[key in ReactionType]: string } = {
  thumb_up: '👍',
  thumb_down: '👎',
  heart_plus: '❤',
  celebration: '🎉',
  notes: '📝',
}

  const mockReactions: Reaction[] = [
    {
      type: 'thumb_up',
      count: 3,
      isActive: true,
    },
    {
      type: 'heart_plus',
      count: 4,
      isActive: false,
    },
  ]

const allReactions: ReactionType[] = ['thumb_up', 'thumb_down', 'heart_plus', 'celebration', 'notes']

export {reactionMapping, reactionMappingObj, allReactions, mockReactions}