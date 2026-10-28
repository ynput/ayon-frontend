import { expect, test } from '@playwright/test'
import { createElement } from 'react'
import RelativeLink from '../../shared/src/containers/Feed/components/ActivityComment/RelativeLink'
import { DetailsPanelContext } from '../../shared/src/context/details-panel/DetailsPanelContextInstance'
import { renderToHtml } from './support/render'

const url = '/projects/demo/overview'
const props = { to: url, children: 'the overview' }
const link = `<a href="${url}">the overview</a>`

// an addon bundles its own react-router, so the feed has no router above it there
test('a relative link in a comment renders without a router', () => {
  expect(renderToHtml(RelativeLink, props)).toBe(link)
})

test('a relative link in a comment uses the router hooks of the details panel', () => {
  let calls = 0
  const useNavigate = () => {
    calls++
    return () => {}
  }
  const html = renderToHtml(RelativeLink, props, (element) =>
    createElement(DetailsPanelContext.Provider, { value: { useNavigate } as any }, element),
  )

  expect(html).toBe(link)
  expect(calls).toBe(1)
})
