const getMentionVersions = (versions) =>
  versions.map((v, i) => ({
    label: v.name,
    image: v.thumbnailUrl,
    id: v.id + i.toString(),
    keywords: [v.name],
  }))

export default getMentionVersions
