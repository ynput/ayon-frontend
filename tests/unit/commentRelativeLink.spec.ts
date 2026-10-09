import { expect, test } from '@playwright/test'
import RelativeLink from '../../shared/src/containers/Feed/components/ActivityComment/RelativeLink'
import { renderToHtml } from './support/render'

const url = '/projects/demo/overview'

// an addon bundles its own react-router, so the feed has no router above it there
test('a relative link in a comment renders without a router', () => {
  const html = renderToHtml(RelativeLink, { to: url, children: 'the overview' })
  expect(html).toBe(`<a href="${url}">the overview</a>`)
})
