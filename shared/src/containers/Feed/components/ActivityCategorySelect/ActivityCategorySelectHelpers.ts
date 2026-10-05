import type { ActivityCategory } from '@shared/api'

export const isCategoryHidden = (
  categories: ActivityCategory[],
  { isGuest, isAdmin }: { isGuest?: boolean; isAdmin: boolean },
) => {
  // guest can never see categories. They create comments with categories but cannot see them
  if (isGuest) return true
  // if there are no categories a regular user has access to, hide the category select
  if (!categories.length && !isAdmin) return true
  // admins always see the category select, even if there are no categories
  return false
}
