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
      userIds: [1, 2, 3],
    },
    {
      type: 'thumb_down',
      userIds: [3],
    },
    {
      type: 'heart_plus',
      userIds: [2, 3],
    },
    {
      type: 'celebration',
      userIds: [1, 2, 3, 4],
    },
  ]

const allReactions: ReactionType[] = ['thumb_up', 'thumb_down', 'heart_plus', 'celebration', 'notes']

export {reactionMapping, reactionMappingObj, allReactions, mockReactions}