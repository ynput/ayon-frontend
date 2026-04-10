import { TeamSuggestionItem, UserSuggestionItem } from '@shared/api'

const getMentionUsers = (users: (UserSuggestionItem | TeamSuggestionItem)[] = []) =>
  users.map((user) => {
    const isTeam = !('fullName' in user)

    if (isTeam) {
      return {
        type: 'team',
        id: user.name,
        label: user.name,
        keywords: [user.name],
        relevance: user.relevance,
        icon: 'group',
        suffix: 'Team',
      }
    }

    const userItem = user as UserSuggestionItem
    return {
      type: 'user',
      id: userItem.name,
      label: userItem.fullName || userItem.name,
      keywords: [userItem.name, userItem.fullName],
      relevance: userItem.relevance,
    }
  })

export default getMentionUsers
