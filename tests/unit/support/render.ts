import { createElement, FunctionComponent, ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// Playwright compiles the JSX of the files it loads to its own element objects (for component
// testing). These helpers turn them into React elements, so a component can be rendered here.
const adapted = new WeakMap<Function, FunctionComponent<any>>()

const adapt = (Component: Function): FunctionComponent<any> => {
  if (!adapted.has(Component)) adapted.set(Component, (props) => toReact(Component(props)))
  return adapted.get(Component)!
}

const toReact = (node: any): ReactNode => {
  if (Array.isArray(node)) return node.map(toReact)
  if (node?.__pw_type !== 'jsx') return node
  const { children, ...props } = node.props
  const type = typeof node.type === 'function' ? adapt(node.type) : node.type
  const childNodes = children === undefined ? [] : [children].flat().map(toReact)
  return createElement(type, { ...props, key: node.key }, ...childNodes)
}

/** Renders a component from the app to HTML, without a browser. */
export const renderToHtml = (Component: Function, props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(createElement(adapt(Component), props))
