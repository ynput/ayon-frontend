const getMentionUsers = (users = []) =>
  users.map((user) => ({
    type: 'user',
    id: user.name,
    label: user.fullName || user.name,
    image: user.avatarUrl,
    keywords: [user.name, user.fullName],
    onEntities: user.onEntities,
    onSameTeam: user.onSameTeam,
  }))

export default getMentionUsers
