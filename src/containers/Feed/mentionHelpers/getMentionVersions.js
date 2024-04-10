const getMentionVersions = (versions) =>
  versions.map((v) => ({
    type: 'version',
    label: v.name,
    image: v.thumbnailId,
    icon: 'layers',
    id: v.id,
    keywords: [v.name],
  }))

export default getMentionVersions
