import { expect, test } from '@playwright/test'
import { isCategoryHidden } from '../../shared/src/containers/Feed/components/ActivityCategorySelect/ActivityCategorySelectHelpers'
import { createCommentFlags } from '../../shared/src/containers/Feed/components/ActivityComment/createCommentFlags'

type Category = Parameters<typeof isCategoryHidden>[0][number]

const director = { name: 'Director', color: '#44ee9f', access: {}, accessLevel: 30 } as Category

test.describe('category picker visibility', () => {
  test('guests never see it, even as admins with categories', () => {
    expect(isCategoryHidden([director], { isGuest: true, isAdmin: true })).toBe(true)
  })

  test('users see it only with a category to post in', () => {
    expect(isCategoryHidden([director], { isAdmin: false })).toBe(false)
    expect(isCategoryHidden([], { isAdmin: false })).toBe(true)
  })

  test('admins see it without any categories', () => {
    expect(isCategoryHidden([], { isAdmin: true })).toBe(false)
  })
})

test.describe('comment flags', () => {
  const options = {
    category: null,
    categoryNotFound: false,
    frameLink: null,
    formatFrame: String,
    onFrameLinkClick: () => {},
    canNavigateToFrame: true,
    isGuest: false,
  }

  test('a comment in a category is flagged with its name', () => {
    expect(createCommentFlags({ ...options, category: director })).toEqual([
      { id: 'category', label: 'Director', tooltip: 'Category: Director' },
    ])
  })

  test('a removed category is still flagged, and says it is gone', () => {
    expect(
      createCommentFlags({ ...options, category: { name: 'Old' }, categoryNotFound: true }),
    ).toEqual([
      { id: 'category', label: 'Old', tooltip: 'Category not found. It may have been deleted.' },
    ])
  })

  test('no flag without a category, or for guests', () => {
    expect(createCommentFlags(options)).toEqual([])
    expect(createCommentFlags({ ...options, category: director, isGuest: true })).toEqual([])
  })
})
