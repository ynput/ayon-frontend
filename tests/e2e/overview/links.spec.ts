import { Page } from '@playwright/test'
import { expect, test } from '../fixtures'
import { OverviewPage } from '../pages/OverviewPage'

const BREAKDOWN_OUT = 'link_breakdown_folder_folder_out'

// FLAG: the link search results are list items without a name, found by the entity label
const linkResult = (page: Page, label: string) =>
  page.getByRole('listitem').filter({ has: page.getByText(label, { exact: true }) })

test.describe('links', () => {
  test('search for a folder to link sends one request for the typed text', async ({
    page,
    api,
    projectName,
  }) => {
    const sh010 = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const sh020 = await api.createFolder(projectName, { name: 'sh020', folderType: 'Shot' })
    await api.createFolder(projectName, { name: 'sh030', folderType: 'Shot' })
    await api.createFolder(projectName, { name: 'sh040', folderType: 'Shot' })
    await api.setWorkingViewColumns('overview', projectName, ['name', BREAKDOWN_OUT])
    const searches: string[] = []
    page.on('request', (req) => {
      const body = req.postDataJSON?.() ?? null
      if (body?.query?.includes('query GetSearchedFolders(')) searches.push(body.variables.search)
    })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)

    await overview.cell('sh010', BREAKDOWN_OUT).dblclick()
    await page.getByPlaceholder('Search folders...').pressSequentially('sh020, sh030')

    await expect(linkResult(page, 'sh020')).toBeVisible()
    await expect(linkResult(page, 'sh030')).toBeVisible()
    await expect(linkResult(page, 'sh040')).toBeHidden()
    expect(searches).toEqual(['sh020, sh030'])

    await linkResult(page, 'sh020').click()
    await expect
      .poll(async () => {
        const data = await api.graphql(
          `query Links($project: String!, $id: String!) {
            project(name: $project) { folder(id: $id) { links { edges { entityId direction } } } }
          }`,
          { project: projectName, id: sh010.id },
        )
        return data.project.folder.links.edges.map((e: any) => [e.direction, e.entityId])
      })
      .toEqual([['out', sh020.id]])
  })
})
