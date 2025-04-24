type ReactionType = 'thumb_up' | 'thumb_down' | 'heart_plus' | 'celebration' | 'notes'
type ReactionComponentVariant = 'standard' | 'compact'

type Reaction = {
  type: ReactionType
  isActive: boolean
  users?: string[]
}

export type { ReactionType, Reaction, ReactionComponentVariant }
