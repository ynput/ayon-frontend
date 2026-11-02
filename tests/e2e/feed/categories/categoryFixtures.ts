import { expect, test as base } from '../../permissions/restrictedUser'
import { requireAddon } from '../../support/addons'
import { AyonApi } from '../../support/api'

/** Access levels of a category's access map (powerpack `activity_categories`) */
export const NONE = 0
export const VIEWER = 10
export const CREATOR = 20
/** what /activityCategories reports when the user may post: managers and creators alike */
export const CAN_POST = 30

export type Category = { name: string; color?: string; access: Record<string, number> }

export const user = (name: string) => `user:${name}`
export const team = (name: string) => `team:${name}`
export const group = (name: string) => `group:${name}`
export const EVERYONE = '__everyone__'

type CategoryFixtures = {
  /** production version of powerpack; tests using it are skipped without a licensed powerpack */
  powerpack: string
  /** Replaces the test project's categories (project settings) and waits until the server uses them */
  setCategories: (categories: Category[]) => Promise<void>
}

export const test = base.extend<CategoryFixtures>({
  powerpack: async ({ api }, use) => {
    // categories need powerpack 1.3.0 (the comment box says so too)
    await use(await requireAddon(api, 'powerpack', { license: true, minVersion: '1.3.0' }))
  },

  setCategories: async ({ api, projectName, powerpack }, use) => {
    await use(async (categories) => {
      await api.updateProjectAddonSettings('powerpack', powerpack, projectName, (settings) => ({
        ...settings,
        activity_categories: categories.map((c) => ({ color: '#3b82f6', ...c })),
      }))
      // the resolved categories are cached in redis until the settings.changed event clears them
      await expect
        .poll(async () => (await api.listActivityCategories(projectName)).map((c) => c.name))
        .toEqual(categories.map((c) => c.name))
    })
  },
})

export { expect }

/** Categories of the comments on an entity, as `user` sees them (null = no category) */
export const visibleCategories = async (
  as: AyonApi,
  projectName: string,
  entityType: 'folder' | 'task' | 'version',
  entityId: string,
) =>
  (await as.listActivities(projectName, entityType, entityId))
    .map((a) => a.category ?? null)
    .sort((a, b) => String(a).localeCompare(String(b)))

/** name -> access level of the categories `as` can see (absent = not visible) */
export const accessLevels = async (as: AyonApi, projectName: string) =>
  Object.fromEntries(
    (await as.listActivityCategories(projectName)).map((c) => [c.name, c.accessLevel]),
  )

/** HTTP status of posting a comment with a category, as `as` */
export const postStatus = async (
  as: AyonApi,
  projectName: string,
  taskId: string,
  category: string | null,
) => {
  const res = await as.request.post(`/api/projects/${projectName}/tasks/${taskId}/activities`, {
    data: { activityType: 'comment', body: `posted in ${category}`, data: { category } },
  })
  return res.status()
}
