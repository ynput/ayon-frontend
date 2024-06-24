// we flatten the version object a little bit
export const transformMentionVersionsData = (
  data = {},
  { currentUser, projectName, entityType } = {},
) => {
  const versions = []
  // loop over each activity and remap the nested properties
  data?.project?.versions?.edges?.forEach((edge) => {
    // remapping keys are the fields path in the object
    // and the values are the new keys to assign the values to
    const data = edge.node

    if (!data) {
      return
    }

    const versionNode = data

    // add isOwner
    const isOwner = currentUser === versionNode.author?.name

    const transformedVersion = { ...versionNode, projectName, isOwner, entityType }
    transformedVersion.isOwner = isOwner

    versions.push(transformedVersion)
  }) || []

  return versions
}

export const transformMentionTasksData = (tasksEdges = []) => {
  return tasksEdges.flatMap(
    (ef) =>
      ef?.node?.tasks?.edges.map((et) => ({
        ...et?.node,
        label: et?.node?.label || et?.node?.name,
        folderId: ef?.node?.id,
        folderLabel: ef?.node?.label || ef?.node?.name,
      })) || [],
  )
}
