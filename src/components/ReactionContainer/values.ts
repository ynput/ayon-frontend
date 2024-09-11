const reactionMapping: { key: ReactionType; value: string }[] = [
  { key: 'thumb_up', value: '👍' },
  { key: 'thumb_down', value: '👎' },
  { key: 'heart_plus', value: '❤' },
  { key: 'celebration', value: '🎉' },
  { key: 'notes', value: '📝' },
]

const reactionMappingObj: { [key in ReactionType]: string } = {
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

const allReactions: ReactionType[] = [
  'thumb_up',
  'thumb_down',
  'heart_plus',
  'celebration',
  'notes',
]

const createFirstReaction = (type: ReactionType): Reaction => {
  return {
    type: type,
    count: 1,
    isActive: true,
  }
}

const sortedReactions = (reactions: Reaction[]): Reaction[] => {
  const sorted = [...reactions].sort(
    (a, b) => allReactions.indexOf(a.type) - allReactions.indexOf(b.type),
  )
  return sorted
}

const updateReactionData = (reactions: Reaction[], changedReaction: Reaction): Reaction[] => {
  const existingReaction = reactions.filter((reaction) => reaction.type == changedReaction.type)[0]
  const filteredReactions = reactions.filter((reaction) => reaction.type != changedReaction.type)
  if (changedReaction.isActive) {
    if (existingReaction) {
      return sortedReactions([
        ...filteredReactions,
        { ...existingReaction, count: existingReaction.count! + 1, isActive: true },
      ])
    } else {
      return sortedReactions([...filteredReactions, createFirstReaction(changedReaction.type)])
    }
  }

  //Only one 'like' existed, removing it from the list
  if (existingReaction.count == 1) {
    return filteredReactions
  }

  //Decrementing and changing status to inactive
  return sortedReactions([
    ...filteredReactions,
    { ...existingReaction, count: existingReaction.count! - 1, isActive: false },
  ])
}

export { reactionMapping, reactionMappingObj, allReactions, mockReactions, updateReactionData }
