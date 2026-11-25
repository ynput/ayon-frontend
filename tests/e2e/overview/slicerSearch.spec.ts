import { expect, test } from '../fixtures'
import { HierarchySlicer } from '../pages/HierarchySlicer'
import { OverviewPage } from '../pages/OverviewPage'

test('folders can be collapsed and expanded while searching the hierarchy slicer', async ({
  page,
  api,
  projectName,
}) => {
  // ep010 > sq010 > sh010, sh020, ep010 > sq020 > sh030, and assets > chars
  const ep010 = await api.createFolder(projectName, { name: 'ep010', folderType: 'Episode' })
  const sq010 = await api.createFolder(projectName, {
    name: 'sq010',
    folderType: 'Sequence',
    parentId: ep010.id,
  })
  for (const name of ['sh010', 'sh020'])
    await api.createFolder(projectName, { name, folderType: 'Shot', parentId: sq010.id })
  const sq020 = await api.createFolder(projectName, {
    name: 'sq020',
    folderType: 'Sequence',
    parentId: ep010.id,
  })
  await api.createFolder(projectName, { name: 'sh030', folderType: 'Shot', parentId: sq020.id })
  const assets = await api.createFolder(projectName, { name: 'assets', folderType: 'Folder' })
  await api.createFolder(projectName, { name: 'chars', folderType: 'Folder', parentId: assets.id })

  const overview = new OverviewPage(page)
  const slicer = new HierarchySlicer(page)
  await overview.goto(projectName)

  // before the search: assets open by hand, ep010 closed
  await slicer.toggle('assets')
  await expect(slicer.row('chars')).toBeVisible()
  await slicer.expectExpanded('ep010', false)
  await expect(slicer.row('sq010')).toBeHidden()

  // the search opens the folders holding matches
  await slicer.openSearch()
  await slicer.searchInput().fill('sh01')
  await expect(slicer.row('sh010')).toBeVisible()
  await expect(slicer.row('sh020')).toBeHidden()
  await expect(slicer.row('sq020')).toBeHidden()
  await expect(slicer.row('assets')).toBeHidden()

  // a folder can be collapsed while searching
  await slicer.toggle('sq010')
  await slicer.expectExpanded('sq010', false)
  await expect(slicer.row('sh010')).toBeHidden()

  // and stays collapsed while typing on, when the matches under it stay the same
  await slicer.searchInput().click()
  await slicer.searchInput().press('End')
  await slicer.searchInput().pressSequentially('0')
  await expect(slicer.searchInput()).toHaveValue('sh010')
  await slicer.expectExpanded('sq010', false)
  await expect(slicer.row('sh010')).toBeHidden()

  // it can be opened again by hand
  await slicer.toggle('sq010')
  await slicer.expectExpanded('sq010', true)
  await expect(slicer.row('sh010')).toBeVisible()

  // a new match under a collapsed folder opens it again; sq010 keeps the state the user gave it
  await slicer.toggle('sq010')
  await slicer.toggle('ep010')
  await expect(slicer.row('sq010')).toBeHidden()
  await slicer.searchInput().fill('sh010, sh030')
  await slicer.expectExpanded('ep010', true)
  await expect(slicer.row('sh030')).toBeVisible()
  await slicer.expectExpanded('sq010', false)
  await expect(slicer.row('sh010')).toBeHidden()

  // clearing the search brings back the folders as they were before it
  await slicer.closeSearch()
  await slicer.expectExpanded('assets', true)
  await expect(slicer.row('chars')).toBeVisible()
  await slicer.expectExpanded('ep010', false)
  await expect(slicer.row('sq010')).toBeHidden()
})
