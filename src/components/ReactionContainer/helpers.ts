import { Reaction, ReactionType } from './types'

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
  heart_plus: '❤️',
  celebration: '🎉',
  notes: '📝',
}

const allReactionsTypes: ReactionType[] = [
  'thumb_up',
  'thumb_down',
  'heart_plus',
  'celebration',
  'notes',
]

const getSortedReactions = (reactions: Reaction[]): Reaction[] => {
  const sorted = [...reactions].sort(
    (a, b) => allReactionsTypes.indexOf(a.type) - allReactionsTypes.indexOf(b.type),
  )
  return sorted
}

export { reactionMapping, reactionMappingObj, allReactionsTypes, getSortedReactions }
