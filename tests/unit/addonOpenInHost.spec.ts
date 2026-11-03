import { expect, test } from '@playwright/test'
import { provideHost } from '../../addon/src/hostBridge'
import { closeDetails, openDetails, openViewer } from '../../addon/src/openInHost'
import { checkManifest } from '../../addon/src/validate'

const task = { projectName: 'demo', entityType: 'task', id: 't1' }

test.afterEach(() =>
  provideHost({
    openDetails: undefined,
    closeDetails: undefined,
    openViewer: undefined,
    navigate: undefined,
  }),
)

test('openDetails shows the page panel, one call for all entities', () => {
  const calls: unknown[] = []
  provideHost({ openDetails: (entities) => (calls.push(entities), true) })
  expect(openDetails([task, { ...task, id: 't2' }])).toBe(true)
  expect(calls).toEqual([[task, { ...task, id: 't2' }]])
  // one entity works without a list
  expect(openDetails(task)).toBe(true)
})

test('openDetails falls back to the entity link when the page has no panel', () => {
  const urls: string[] = []
  provideHost({ openDetails: () => false, navigate: (to) => urls.push(to) })
  expect(openDetails(task)).toBe(true)
  expect(urls).toEqual(['/projects/demo/overview?project=demo&type=task&id=t1'])
})

test('openDetails refuses an empty list or a mix of types and projects', () => {
  const urls: string[] = []
  provideHost({ openDetails: () => true, navigate: (to) => urls.push(to) })
  expect(openDetails([])).toBe(false)
  expect(openDetails([task, { ...task, entityType: 'folder' }])).toBe(false)
  expect(openDetails([task, { ...task, projectName: 'other' }])).toBe(false)
  expect(urls).toEqual([])
})

test('closeDetails asks the host and is a no-op without one', () => {
  expect(() => closeDetails()).not.toThrow()
  let closed = 0
  provideHost({ closeDetails: () => closed++ })
  closeDetails()
  expect(closed).toBe(1)
})

test('openViewer needs a project, a folder, task or product, and a host viewer', () => {
  const targets: unknown[] = []
  expect(openViewer({ projectName: 'demo', taskId: 't1' })).toBe(false) // no viewer yet
  provideHost({ openViewer: (target) => targets.push(target) })
  expect(openViewer({ projectName: 'demo', versionIds: ['v1'] })).toBe(false)
  expect(openViewer({ projectName: '', taskId: 't1' })).toBe(false)
  expect(openViewer({ projectName: 'demo', productId: 'p1', versionIds: ['v1'] })).toBe(true)
  expect(targets).toEqual([{ projectName: 'demo', productId: 'p1', versionIds: ['v1'] }])
})

test('a project.page may set detailsPanel, only to true or false', () => {
  const page = (detailsPanel: unknown) =>
    checkManifest(
      { name: 'budget', version: '1.0.0' },
      {
        contributes: [
          { slot: 'project.page', id: 'budget', title: 'Budget', component: () => {}, detailsPanel },
        ],
      },
    )
  expect(page(true).skipped).toEqual([])
  expect(page(true).contributions).toHaveLength(1)
  expect(page('yes').skipped.map((s) => s.reason).join()).toContain('detailsPanel must be')
})
