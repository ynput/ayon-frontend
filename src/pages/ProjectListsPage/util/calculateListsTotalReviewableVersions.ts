import { QueryEntityListsItemsForReviewSession } from '@shared/api'

const calculateListsTotalReviewableVersions = (
  list: QueryEntityListsItemsForReviewSession,
): number => {
  return list.items.reduce((total, item) => {
    if (item && 'hasReviewables' in item && item.hasReviewables) {
      return total + 1
    }
    return total
  }, 0)
}

export default calculateListsTotalReviewableVersions
