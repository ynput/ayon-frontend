const getMentionUsers = (users = []) =>
  users.map((user) => ({
    type: 'user',
    id: user.name,
    label: user.fullName || user.name,
    image: user.avatarUrl,
    keywords: [user.name, user.fullName],
  }))

export default getMentionUsers
