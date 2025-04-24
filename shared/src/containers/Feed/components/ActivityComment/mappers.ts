import { allReactionsTypes, getSortedReactions } from '../ReactionContainer/helpers'
import { Reaction, ReactionType } from '../ReactionContainer/types'

type GraphQLActivityReaction = {
  fullName: string
  userName: string
  reaction: string
  timestamp: string
}

const mapGraphQLReactions = (
  reactions: GraphQLActivityReaction[] | undefined = [],
  user: string,
): Reaction[] => {
  let mappedReactions: { [key in ReactionType]?: Reaction } = {}
  reactions.forEach((reaction) => {
    const reactionType = reaction.reaction as ReactionType
    if (!allReactionsTypes.includes(reactionType)) {
      return
    }

    if (mappedReactions[reactionType] === undefined) {
      mappedReactions[reactionType] = { type: reactionType, isActive: false, users: [] }
    }

    if (user == reaction.userName) {
      mappedReactions[reactionType].isActive = true
    }
    mappedReactions[reactionType].users?.push(reaction.fullName || reaction.userName)
  })

  return getSortedReactions(Object.values(mappedReactions))
}

export { mapGraphQLReactions }
