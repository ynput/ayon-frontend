import { TeamSuggestionItem, UserSuggestionItem } from '@shared/api'

const getMentionUsers = (users: (UserSuggestionItem | TeamSuggestionItem)[] = []) =>
  users.map((user) => {
    const isTeam = 'isTeam' in user && user.isTeam

    if (isTeam) {
      const team = user as TeamSuggestionItem
      return {
        type: 'team',
        id: team.name,
        label: team.name,
        keywords: [team.name],
        relevance: team.relevance,
        memberCount: team.memberCount,
        teamLeader: team.teamLeader,
        icon: 'group',
        suffix: team.memberCount ? `${team.memberCount} members` : undefined,
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
