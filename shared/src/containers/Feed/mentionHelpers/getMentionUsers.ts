import { UserSuggestionItem } from '@shared/api'

const getMentionUsers = (users: UserSuggestionItem[] = []) =>
  users.map((user) => ({
    type: 'user',
    id: user.name,
    label: user.fullName || user.name,
    keywords: [user.name, user.fullName],
    relevance: user.relevance,
  }))

export default getMentionUsers
