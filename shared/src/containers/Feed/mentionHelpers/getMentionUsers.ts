import { TeamSuggestionItem, UserSuggestionItem } from '@shared/api'

const getMentionUsers = (
  users: UserSuggestionItem[] = [],
  teams: TeamSuggestionItem[] = [],
) => {
  const userItems = users.map((user) => ({
    type: 'user',
    id: user.name,
    label: user.fullName || user.name,
    keywords: [user.name, user.fullName],
    relevance: user.relevance,
  }))

  const teamItems = teams.map((team) => ({
    type: 'team',
    id: team.name,
    label: team.name,
    keywords: [team.name],
    relevance: team.relevance,
    icon: 'group',
    suffix: 'Team',
  }))

  return [...userItems, ...teamItems]
}

export default getMentionUsers
