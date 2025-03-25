// Helper function to get a nested property of an object using a string path
const getNestedProperty = (obj, path) => path.split('.').reduce((o, p) => (o || {})[p], obj)

// Helper function to delete a nested property of an object using a string path
const deleteNestedProperty = (obj, path) => {
  const pathParts = path.split('.')
  const lastPart = pathParts.pop()
  const target = pathParts.reduce((o, p) => (o || {})[p], obj)
  if (target && lastPart) {
    delete target[lastPart]
  }
}

function remapNestedProperties(object, remappingItems) {
  const transformedObject = { ...object }

  for (const [key, newKey] of Object.entries(remappingItems)) {
    if (getNestedProperty(transformedObject, key) !== undefined) {
      // Get deeply nested value from key using "." notation
      transformedObject[newKey] = getNestedProperty(transformedObject, key)
      // Delete the old key from the object
      deleteNestedProperty(transformedObject, key)
    }
  }

  return transformedObject
}

// we flatten the activity object a little bit
export const transformActivityData = (data = {}, currentUser, deduplicate = true) => {
  const activities = []
  const activitiesData = data?.project?.activities
  const pageInfo = activitiesData?.pageInfo || {}

  const edges = activitiesData?.edges || []
  // loop over each activity and remap the nested properties
  edges.forEach((edge) => {
    // remapping keys are the fields path in the object
    // and the values are the new keys to assign the values to
    const data = edge.node

    if (!data) {
      return
    }

    const activityNode = data

    // check that the activity hasn't already been added.
    if (
      activities.some(({ activityId }) => activityId === activityNode.activityId) &&
      deduplicate
    ) {
      // oh no this shouldn't happen!
      // referenceType priorities in order: origin, mention, relation

      // check the referenceType and if the priority is higher than the current one, place the activity in the list
      if (['origin', 'mention'].includes(activityNode.referenceType)) {
        const index = activities.findIndex(
          ({ activityId }) => activityId === activityNode.activityId,
        )
        if (index !== -1) {
          activities[index] = { ...activityNode }
        }
      }

      return
    }

    // remapping of nested properties to flat properties
    const remappingItems = {
      'author.name': 'authorName',
      'author.attrib.fullName': 'authorFullName',
      'author.attrib.avatarUrl': 'authorAvatarUrl',
    }

    const transformedActivity = remapNestedProperties(activityNode, remappingItems)

    // add isOwner property
    const isOwner = currentUser === transformedActivity.authorName
    transformedActivity.isOwner = isOwner

    // parse fields that are JSON strings
    const jsonFields = ['activityData']

    jsonFields.forEach((field) => {
      if (activityNode[field]) {
        try {
          transformedActivity[field] = JSON.parse(activityNode[field])
        } catch (e) {
          console.error('Error parsing JSON field', field, activityNode[field])
        }
      }
    })

    activities.push(transformedActivity)
  }) || []

  // when there are no activities and hasPreviousPage is false, add an "createdAt" activity as the last activity
  if (pageInfo.hasPreviousPage === false) {
    activities.push({ hasPreviousPage: false, activityType: 'end', activityId: 'end' })
  }

  return { activities, pageInfo }
}

const transformTaskTooltip = (data = {}) => {
  const { id, label, name, status, thumbnailId, assignees, taskType, updatedAt, folder = {} } = data
  const tooltip = {
    id,
    name,
    title: label || name,
    type: 'task',
    subTitle: folder.label || folder.name,
    status,
    thumbnailId,
    updatedAt,
    taskType,
    users: assignees.map((name) => ({ name, avatarUrl: `/api/users/${name}/avatar` })),
    path: folder.path.split('/').splice(-2, 1).join(''),
  }

  return tooltip
}

const transformVersionTooltip = (data = {}) => {
  const { id, name, status, thumbnailId, author, updatedAt, product = {} } = data
  const tooltip = {
    id,
    type: 'version',
    title: name,
    subTitle: product.name,
    status,
    thumbnailId,
    updatedAt,
    users: [{ name: author, avatarUrl: `/api/users/${author}/avatar` }],
    productType: product.productType,
    path: product.folder?.path?.split('/').pop(),
  }

  return tooltip
}

// different types have different tooltip data, we need to create a single data model
export const transformTooltipData = (data = {}, type) => {
  switch (type) {
    case 'task':
      return transformTaskTooltip(data.task)
    case 'version':
      return transformVersionTooltip(data.version)
    default:
      return {}
  }
}

export const countChecklists = (data = {}) => {
  const activities = data?.project?.activities?.edges?.map((edge) => edge?.node)
  // get all bodies from each activity
  const bodies = activities.map((a) => a.body)
  const ids = activities.map((a) => a.activityId)

  // count how many checklists are in each body

  // count unchecked * [ ] items
  const unChecked = bodies.reduce((acc, body) => {
    if (!body) return acc
    const matches = body.match(/\*\s\[\s\]/g)
    return acc + (matches ? matches.length : 0)
  }, 0)

  // count checked * [x] items
  const checked = bodies.reduce((acc, body) => {
    if (!body) return acc
    const matches = body.match(/\*\s\[x\]/g)
    return acc + (matches ? matches.length : 0)
  }, 0)

  return { total: unChecked + checked, checked, unChecked, ids }
}
