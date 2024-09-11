type ReactionType = 'thumb_up' | 'thumb_down'| 'heart_plus' | 'celebration' | 'notes'

type Reaction = {
  type: ReactionType
  userIds: number[]
}
