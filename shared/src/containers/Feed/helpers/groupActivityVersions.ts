import { differenceInMinutes } from 'date-fns'

// transforms a full activity to a version item
// context.product
const activityToVersionItem = (activity: any = {}) => {
  const {
    updatedAt,
    createdAt,
    origin = {},
    activityData: { context: { productName, productType, productId } = {} } = {},
    version,
  } = activity

  const { name, id } = origin

  return {
    name,
    id,
    productId,
    productName,
    productType,
    updatedAt,
    createdAt,
    comment: version?.attrib?.comment || null,
  }
}

// groups similar activities together
// 1. version.publish
// 2. neighboring index
// 3. neighbor same author and same type
// 4. neighbor createdAt is within x minutes
const minDifference = 5

const groupActivityVersions = (activities: any[] = []) => {
  const groupedVersions: any[] = []
  let currentVersion: any = null

  for (const activity of activities) {
    // if it's not a version.publish activity, push it to the groupedVersions
    if (activity.activityType !== 'version.publish') {
      // resets the currentVersion and adds it to the groupedVersions
      if (currentVersion) {
        groupedVersions.push(currentVersion)
        currentVersion = null
      }

      // adds the activity to the groupedVersions
      groupedVersions.push(activity)

      continue
    }

    // if there's no currentVersion, set the first version
    if (!currentVersion) {
      currentVersion = { ...activity }

      currentVersion.versions = [activityToVersionItem(activity)]
      continue
    }

    // here we check if the currentVersion and the activity are similar enough to be grouped together
    // is same author
    const isSameAuthor = currentVersion.authorName === activity.authorName
    const isSameEntity = currentVersion.origin.id === activity.origin.id
    // is within 30 minutes of currentVersion
    const minsDiff = differenceInMinutes(
      new Date(currentVersion.createdAt),
      new Date(activity.createdAt),
    )

    const isWithinMin = minsDiff <= minDifference

    if (isSameAuthor && isWithinMin && isSameEntity) {
      currentVersion.versions.push(activityToVersionItem(activity))
      continue
    } else {
      // if not similar, push the currentVersion to the groupedVersions
      groupedVersions.push(currentVersion)

      // set the currentVersion to the current activity to start a new group
      currentVersion = { ...activity }
      currentVersion.versions = [activityToVersionItem(activity)]
      continue
    }
  }
  // if groupedVersions is empty, push the currentVersion
  if (currentVersion) {
    groupedVersions.push(currentVersion)
  }

  return groupedVersions
}

export default groupActivityVersions
