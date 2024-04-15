const getMentionVersions = (versions) =>
  versions.map((v) => ({
    type: 'version',
    label: v.name,
    image: v.thumbnailId,
    icon: 'layers',
    id: v.id,
    createdAt: v.createdAt,
    context: v.product?.name,
    keywords: [v.name, v.product?.name],
  }))

export default getMentionVersions
