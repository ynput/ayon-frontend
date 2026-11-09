import { Page } from '@playwright/test'

export const holdFolderTasks = async (page: Page, folderId: string) => {
  let release!: () => void
  let captured!: () => void
  const released = new Promise<void>((resolve) => (release = resolve))
  const responseCaptured = new Promise<void>((resolve) => (captured = resolve))

  await page.route('**/graphql', async (route) => {
    const body = route.request().postDataJSON()
    if (
      body?.operationName !== 'GetTasksByParent' ||
      !body.variables?.parentIds?.includes(folderId)
    ) {
      return route.continue()
    }

    const response = await route.fetch()
    captured()
    await released
    await route.fulfill({ response })
  })

  return { responseCaptured, release }
}
